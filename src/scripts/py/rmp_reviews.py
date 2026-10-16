"""Pull every Dal RateMyProfessors review, match it to a course and save it to Supabase.

RMP reviews belong to a teacher and carry the course code the student typed, so codes come in
as "CSCI2110", "csci 2110", "BIO2030" or just "2110". Each one is matched to a course in
database/search.json, using the teacher's other courses to fill in a missing or misspelled
subject. Reviews that can't be matched are skipped.

    python3 rmp_reviews.py --courses CSCI2110,MATH1000 --dry-run out.json   # try a few courses
    python3 rmp_reviews.py                                                  # everything

Writing needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, from the environment or the
repo's .env.local. A full run also deletes reviews RMP no longer has.
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

from supabase_rest import ROOT, Table, load_env

GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"
SCHOOL_ID = base64.b64encode(b"School-1423").decode()
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

# Subjects students commonly write wrong on RMP.
SUBJECT_ALIASES = {
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
}

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
        id legacyId firstName lastName department numRatings
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


def fetch_teachers(session: requests.Session) -> list[dict]:
    teachers, cursor = [], None
    while True:
        page = graphql(session, TEACHERS_QUERY, {"cursor": cursor, "school": SCHOOL_ID})["newSearch"]["teachers"]
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
    """Turns what a student typed into a course code from search.json, or None."""

    def __init__(self, known: set[str]):
        self.known = known
        self.subjects = {code[:4] for code in known}
        self.by_number: dict[str, set[str]] = defaultdict(set)
        for code in known:
            self.by_number[code[4:]].add(code)

    def split(self, raw: str) -> tuple[str, str] | None:
        match = re.fullmatch(r"([A-Z]*)(\d{4})", re.sub(r"[^A-Z0-9]", "", raw.upper()))
        return (match.group(1), match.group(2)) if match else None

    def exact(self, raw: str) -> str | None:
        parts = self.split(raw)
        if not parts:
            return None
        subject = SUBJECT_ALIASES.get(parts[0], parts[0])
        code = subject + parts[1]
        return code if code in self.known else None

    def teacher_subjects(self, raw_codes: list[str]) -> set[str]:
        return {code[:4] for code in (self.exact(raw) for raw in raw_codes) if code}

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
            if code[:4] in subjects and (not parts[0] or edit_distance(parts[0], code[:4]) <= 2)
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


def to_row(rating: dict, teacher: dict, course: str, seen_at: str) -> dict:
    take_again = rating.get("wouldTakeAgain")
    grade = (rating.get("grade") or "").strip().upper()
    attendance = (rating.get("attendanceMandatory") or "").lower()
    reviewed_at = datetime.strptime(rating["date"][:19], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    return {
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


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--courses", help="comma-separated course codes to fetch, e.g. CSCI2110,MATH1000")
    parser.add_argument("--dry-run", metavar="FILE", help="write rows to FILE instead of Supabase")
    args = parser.parse_args()

    known = set(json.loads((ROOT / "database" / "search.json").read_text()))
    only = {code.strip().upper() for code in args.courses.split(",")} if args.courses else None
    if only and only - known:
        sys.exit(f"Not in search.json: {', '.join(sorted(only - known))}")

    table = None if args.dry_run else Table(load_env(), "external_reviews")
    matcher = CourseMatcher(known)
    session = requests.Session()
    session.headers.update(HEADERS)
    seen_at = datetime.now(timezone.utc).isoformat()

    teachers = fetch_teachers(session)
    print(f"{len(teachers)} teachers on RMP", file=sys.stderr)

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
                row = to_row(rating, teacher, course, seen_at)
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
        Path(args.dry_run).write_text(json.dumps(rows, indent=2, ensure_ascii=False))
        print(f"Wrote {args.dry_run}; per course: {by_course.most_common(20)}", file=sys.stderr)
        return

    stored = table.count({"source": "eq.rmp"})
    table.upsert(rows, on_conflict="source,source_id")
    if not only:
        if len(rows) < stored * MIN_SEEN_TO_PRUNE:
            print(f"Only saw {len(rows)} of {stored} stored reviews; not deleting any", file=sys.stderr)
        else:
            # Reviews RMP no longer has weren't seen this run.
            table.delete({"source": "eq.rmp", "last_seen_at": f"lt.{seen_at}"})
    print("Saved to Supabase", file=sys.stderr)


if __name__ == "__main__":
    main()
