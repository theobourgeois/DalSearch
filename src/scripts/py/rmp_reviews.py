"""Pull a university's RateMyProfessors professors and reviews and save them to Supabase.

Every professor's overall numbers go to instructor_ratings, keyed by the name the timetable
would use for them ("Sarhan A."), which is how the app finds an instructor's rating.

RMP reviews belong to a teacher and carry the course code the student typed, so codes come in
as "CSCI2110", "csci 2110", "BIO2030" or just "2110". Each one is matched to one of the
university's courses in Supabase, using the teacher's other courses to fill in a missing or
misspelled subject. Reviews that can't be matched are skipped. They go to external_reviews.

    python3 rmp_reviews.py --courses CSCI2110,MATH1000 --dry-run out.json   # try a few courses
    python3 rmp_reviews.py                                                  # everything at Dal
    python3 rmp_reviews.py --university smu

Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, from the environment or the repo's
.env.local; the university's courses and RMP school id are read from Supabase. A full run also
deletes reviews and professors RMP no longer has.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests

from supabase_rest import Table, load_env

GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"
PROFESSOR_URL = "https://www.ratemyprofessors.com/professor/{}"
HEADERS = {
    "Authorization": "Basic dGVzdDp0ZXN0",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
}
REQUEST_DELAY = 0.3
# A full run deletes stored reviews it didn't see. If it saw much less than what's stored, RMP
# probably returned a partial list, so nothing is deleted.
MIN_SEEN_TO_PRUNE = 0.8

# Subjects students commonly write wrong on RMP, per university.
SUBJECT_ALIASES = {"dal": {
    "BIO": "BIOL",
    "STATS": "STAT",
    "PSYC": "PSYO",
    "PSYCH": "PSYO",
    "PSY": "PSYO",
    "MGNT": "MGMT",
    "ECO": "ECON",
    "CS": "CSCI",
    "COMP": "CSCI",
    "PHYS": "PHYC",
    "PHY": "PHYC",
    "CHEMISTRY": "CHEM",
    "MATHS": "MATH",
    "CALC": "MATH",
    "CAL": "MATH",
}}

# RMP's tags, keyed by lowercase because older reviews have them in capitals.
TAGS = {
    tag.lower(): tag
    for tag in [
        "Tough grader", "Get ready to read", "Participation matters", "Skip class? You won't pass.",
        "Lots of homework", "Inspirational", "Beware of pop quizzes", "Accessible outside class",
        "So many papers", "Clear grading criteria", "Hilarious", "Test heavy", "Graded by few things",
        "Amazing lectures", "Caring", "Extra credit", "Group projects", "Lecture heavy",
        "Gives good feedback", "Respected", "Online savvy",
    ]
}
GRADES = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"}

TEACHERS_QUERY = """
query ($cursor: String, $school: ID!) {
  newSearch {
    teachers(query: {text: "", schoolID: $school}, first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        id legacyId firstName lastName department numRatings avgRating avgDifficulty wouldTakeAgainPercent
        courseCodes { courseName courseCount }
      } }
    }
  }
}
"""

RATINGS_QUERY = """
query ($id: ID!, $cursor: String, $course: String) {
  node(id: $id) {
    ... on Teacher {
      ratings(first: 1000, after: $cursor, courseFilter: $course) {
        pageInfo { hasNextPage endCursor }
        edges { node {
          legacyId class comment date qualityRating difficultyRating ratingTags
          wouldTakeAgain grade attendanceMandatory isForOnlineClass
          thumbsUpTotal thumbsDownTotal flagStatus
        } }
      }
    }
  }
}
"""


def graphql(session: requests.Session, query: str, variables: dict) -> dict:
    for attempt in range(5):
        time.sleep(REQUEST_DELAY * (2**attempt))
        try:
            response = session.post(GRAPHQL_URL, json={"query": query, "variables": variables}, timeout=30)
            if response.status_code == 429 or response.status_code >= 500:
                raise requests.HTTPError(f"HTTP {response.status_code}")
            response.raise_for_status()
            body = response.json()
            if body.get("errors"):
                raise RuntimeError(body["errors"])
            return body["data"]
        except (requests.RequestException, ValueError) as error:
            if attempt == 4:
                raise
            print(f"  retrying after {error}", file=sys.stderr)
    raise AssertionError("unreachable")


def fetch_teachers(session: requests.Session, school_id: str) -> list[dict]:
    teachers, cursor = [], None
    school = base64.b64encode(school_id.encode()).decode()
    while True:
        page = graphql(session, TEACHERS_QUERY, {"cursor": cursor, "school": school})["newSearch"]["teachers"]
        teachers += [edge["node"] for edge in page["edges"]]
        if not page["pageInfo"]["hasNextPage"]:
            return teachers
        cursor = page["pageInfo"]["endCursor"]


def fetch_ratings(session: requests.Session, teacher_id: str, course: str | None = None) -> list[dict]:
    ratings, cursor = [], None
    while True:
        data = graphql(session, RATINGS_QUERY, {"id": teacher_id, "cursor": cursor, "course": course})
        page = data["node"]["ratings"]
        ratings += [edge["node"] for edge in page["edges"]]
        if not page["pageInfo"]["hasNextPage"]:
            return ratings
        cursor = page["pageInfo"]["endCursor"]


class CourseMatcher:
    """Turns what a student typed into one of the university's course codes, or None."""

    def __init__(self, courses: list[dict], aliases: dict[str, str]):
        # code -> subject code, e.g. "CSCI2110" -> "CSCI"
        self.subject_of = {course["code"]: course["subject_code"] for course in courses}
        self.known = set(self.subject_of)
        self.subjects = set(self.subject_of.values())
        self.aliases = aliases
        self.by_number: dict[str, set[str]] = defaultdict(set)
        for course in courses:
            self.by_number[course["number"]].add(course["code"])

    def split(self, raw: str) -> tuple[str, str] | None:
        """ "csci 2110" -> ("CSCI", "2110"): leading letters, then a number that starts with a digit."""
        match = re.fullmatch(r"([A-Z]*)(\d[A-Z0-9]*)", re.sub(r"[^A-Z0-9]", "", raw.upper()))
        return (match.group(1), match.group(2)) if match else None

    def exact(self, raw: str) -> str | None:
        parts = self.split(raw)
        if not parts:
            return None
        subject = self.aliases.get(parts[0], parts[0])
        code = subject + parts[1]
        return code if code in self.known else None

    def teacher_subjects(self, raw_codes: list[str]) -> set[str]:
        return {self.subject_of[code] for code in (self.exact(raw) for raw in raw_codes) if code}

    def match(self, raw: str, subjects: set[str]) -> str | None:
        """Exact or aliased code first, then the number under one of the teacher's subjects.

        The subject the student typed has to be missing or a near miss ("PYSO") of the one
        it's matched to, so "ENGL2110" from a CS prof stays unmatched rather than becoming
        CSCI2110.
        """
        code = self.exact(raw)
        if code:
            return code
        parts = self.split(raw)
        if not parts or parts[0] in self.subjects:
            return None
        candidates = {
            code
            for code in self.by_number.get(parts[1], ())
            if self.subject_of[code] in subjects
            and (not parts[0] or edit_distance(parts[0], self.subject_of[code]) <= 2)
        }
        return candidates.pop() if len(candidates) == 1 else None


def edit_distance(a: str, b: str) -> int:
    """Levenshtein distance, counting a swap of neighbouring letters as one edit."""
    rows = [[i + j if i * j == 0 else 0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            rows[i][j] = min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                rows[i][j] = min(rows[i][j], rows[i - 2][j - 2] + 1)
    return rows[-1][-1]


def parse_tags(raw: str | None) -> list[str]:
    tags = (tag.strip() for tag in (raw or "").split("--"))
    return list(dict.fromkeys(TAGS.get(tag.lower(), tag) for tag in tags if tag))


def clean_comment(raw: str | None) -> str | None:
    text = html.unescape(raw or "").strip()
    return None if not text or text.lower() == "no comments" else text


# Universities whose timetables print full names ("Paul Muir") rather than "Muir P.".
FULL_NAMES = {"smu"}


def match_name(teacher: dict, university: str) -> str:
    """The name the university's timetable lists them under: "Sarhan A." at Dal, "Paul Muir" at SMU."""
    first, last = teacher["firstName"].strip(), teacher["lastName"].strip()
    if university in FULL_NAMES:
        return f"{first} {last}".strip()
    return f"{last} {first[:1]}." if first else last


def to_rating_row(teacher: dict, university: str, seen_at: str) -> dict:
    """A professor's overall numbers. RMP sends 0 for "no ratings" and -1 for "nobody answered"."""
    def score(value):
        return value if isinstance(value, (int, float)) and value > 0 else None

    take_again = teacher.get("wouldTakeAgainPercent")
    return {
        "university_id": university,
        "source": "rmp",
        "source_id": str(teacher["legacyId"]),
        "match_name": match_name(teacher, university),
        "first_name": teacher["firstName"].strip(),
        "last_name": teacher["lastName"].strip(),
        "profile_url": PROFESSOR_URL.format(teacher["legacyId"]),
        "rating": score(teacher.get("avgRating")),
        "difficulty": score(teacher.get("avgDifficulty")),
        "would_take_again": round(take_again, 2) if isinstance(take_again, (int, float)) and take_again >= 0 else None,
        "rating_count": teacher.get("numRatings") or 0,
        "last_seen_at": seen_at,
    }


def to_row(rating: dict, teacher: dict, course: str, university: str, seen_at: str) -> dict:
    take_again = rating.get("wouldTakeAgain")
    grade = (rating.get("grade") or "").strip().upper()
    attendance = (rating.get("attendanceMandatory") or "").lower()
    reviewed_at = datetime.strptime(rating["date"][:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    return {
        "university_id": university,
        "source": "rmp",
        "source_id": str(rating["legacyId"]),
        "course_code": course,
        "source_course": rating.get("class") or "",
        "instructor": f"{teacher['firstName'].strip()} {teacher['lastName'].strip()}",
        "instructor_url": PROFESSOR_URL.format(teacher["legacyId"]),
        "review_text": clean_comment(rating.get("comment")),
        "quality": rating.get("qualityRating") or None,
        "difficulty": rating.get("difficultyRating") or None,
        "would_take_again": None if take_again is None else take_again == 1,
        "grade": grade if grade in GRADES else None,
        "tags": parse_tags(rating.get("ratingTags")),
        "attendance_mandatory": {"mandatory": True, "non mandatory": False}.get(attendance),
        "online": rating.get("isForOnlineClass"),
        "thumbs_up": rating.get("thumbsUpTotal") or 0,
        "thumbs_down": rating.get("thumbsDownTotal") or 0,
        "reviewed_at": reviewed_at.isoformat(),
        "last_seen_at": seen_at,
    }


def prune(table: Table, university: str, saw: int, seen_at: str, what: str) -> None:
    """Deletes rows a full run didn't see, unless it saw much less than what's stored."""
    filters = {"university_id": f"eq.{university}", "source": "eq.rmp"}
    stored = table.count(filters)
    if saw < stored * MIN_SEEN_TO_PRUNE:
        print(f"Only saw {saw} of {stored} stored {what}; not deleting any", file=sys.stderr)
    else:
        table.delete({**filters, "last_seen_at": f"lt.{seen_at}"})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--university", default="dal", help="university id in Supabase (default dal)")
    parser.add_argument("--courses", help="comma-separated course codes to fetch, e.g. CSCI2110,MATH1000")
    parser.add_argument("--dry-run", metavar="FILE", help="write rows to FILE instead of Supabase")
    args = parser.parse_args()

    env = load_env()
    university = args.university
    universities = Table(env, "universities").select_all("rmp_school_id", {"id": f"eq.{university}"}, "id")
    if not universities or not universities[0]["rmp_school_id"]:
        sys.exit(f"No RateMyProfessors school id for {university}")
    courses = Table(env, "courses").select_all("code,subject_code,number", {"university_id": f"eq.{university}"}, "code")
    if not courses:
        sys.exit(f"No courses stored for {university}; refresh the timetable first")

    matcher = CourseMatcher(courses, SUBJECT_ALIASES.get(university, {}))
    only = {code.strip().upper() for code in args.courses.split(",")} if args.courses else None
    if only and only - matcher.known:
        sys.exit(f"Not a {university} course: {', '.join(sorted(only - matcher.known))}")

    session = requests.Session()
    session.headers.update(HEADERS)
    seen_at = datetime.now(timezone.utc).isoformat()

    teachers = fetch_teachers(session, universities[0]["rmp_school_id"])
    print(f"{len(teachers)} teachers on RMP", file=sys.stderr)
    ratings_rows = list({row["source_id"]: row for row in (to_rating_row(t, university, seen_at) for t in teachers)}.values())

    rows, unmatched = {}, Counter()
    rated = [teacher for teacher in teachers if teacher["numRatings"]]
    for index, teacher in enumerate(rated, 1):
        raw_codes = [course["courseName"] for course in teacher["courseCodes"]]
        subjects = matcher.teacher_subjects(raw_codes)
        if only:
            # Ask RMP for just the codes this teacher used for the courses we want.
            wanted = [raw for raw in raw_codes if matcher.match(raw, subjects) in only]
            ratings = [rating for raw in wanted for rating in fetch_ratings(session, teacher["id"], raw)]
        else:
            ratings = fetch_ratings(session, teacher["id"])

        for rating in ratings:
            if rating.get("flagStatus") == "FLAGGED":
                continue
            course = matcher.match(rating.get("class") or "", subjects)
            if course and (not only or course in only):
                row = to_row(rating, teacher, course, university, seen_at)
                rows[row["source_id"]] = row
            elif not course:
                unmatched[rating.get("class") or "(blank)"] += 1

        if index % 100 == 0:
            print(f"  {index}/{len(rated)} teachers, {len(rows)} reviews", file=sys.stderr)

    rows = list(rows.values())
    by_course = Counter(row["course_code"] for row in rows)
    print(f"{len(rows)} reviews across {len(by_course)} courses", file=sys.stderr)
    if not only:
        skipped = sum(unmatched.values())
        print(f"{skipped} reviews skipped with no course match, most common: {unmatched.most_common(15)}", file=sys.stderr)

    if args.dry_run:
        Path(args.dry_run).write_text(json.dumps({"ratings": ratings_rows, "reviews": rows}, indent=2, ensure_ascii=False))
        print(f"Wrote {args.dry_run}; per course: {by_course.most_common(20)}", file=sys.stderr)
        return

    # The teacher list is always complete, so professors are saved and pruned on every run.
    ratings_table = Table(env, "instructor_ratings")
    ratings_table.upsert(ratings_rows, on_conflict="source,source_id")
    prune(ratings_table, university, len(ratings_rows), seen_at, "professors")

    reviews_table = Table(env, "external_reviews")
    reviews_table.upsert(rows, on_conflict="source,source_id")
    if not only:
        prune(reviews_table, university, len(rows), seen_at, "reviews")
    print("Saved to Supabase", file=sys.stderr)


if __name__ == "__main__":
    main()
