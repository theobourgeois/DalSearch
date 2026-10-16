"""Find public Dal syllabi and pull the useful parts out of them with GPT-6 Luna.

Departments post syllabus PDFs on cdn.dal.ca and link them from their pages on www.dal.ca.
Candidates come from two places: the Wayback Machine's index of Dal files (older uploads)
and a crawl of the live faculty pages (current ones). A PDF is kept when its file name has
a course from database/search.json and a year on or after --since. Each one is downloaded,
its text is sent to the model, and what comes back (grading, assessments, textbooks,
policies, weekly topics) is written to --out. The PDF text itself isn't kept.

    python3 syllabi.py --out ../../../database/syllabi_cache.json          # find and extract new ones
    python3 syllabi.py --out ../../../database/syllabi_cache.json --save   # then save to Supabase

Run it at the start of each term, when departments post new syllabi.

--out doubles as a cache: documents already in it aren't downloaded or sent again.
Needs OPENAI_API_KEY, and for --save NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, from
the environment or the repo's .env.local.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import re
import sys
import threading
import time
import urllib.parse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from pypdf import PdfReader

from supabase_rest import ROOT, Table, load_env

MODEL = "gpt-6-luna"
USER_AGENT = "Mozilla/5.0 (compatible; DalSearch syllabus indexer; +https://dalsearch.com)"
CDX_URL = "http://web.archive.org/cdx/search/cdx"
MAX_TEXT = 120_000
logging.getLogger("pypdf").setLevel(logging.ERROR)  # it warns on most Dal PDFs

# Wayback prefixes and the file names worth asking about under each.
CDX_QUERIES = [
    ("cdn.dal.ca/content/dam/", r"(?i).*(syllab|outline).*"),
    ("cdn.dal.ca/content/dam/", r"(?i).*[A-Za-z]{4}(%20|%2520|-|_)?[1-9][0-9]{3}.*\.pdf.*"),
    ("www.dal.ca/", r"(?i).*(syllab|outline).*\.pdf.*"),
    ("web.cs.dal.ca/", r"(?i).*(syllab|outline).*"),
    ("mathstat.dal.ca/", r"(?i).*(syllab|outline).*"),
]
CRAWL_START = ["https://www.dal.ca/faculty.html"] + [
    f"https://www.dal.ca/faculty/{faculty}.html"
    for faculty in [
        "science", "arts", "management", "computerscience", "engineering", "health",
        "agriculture", "architecture-planning", "law", "medicine", "dentistry", "open-learning",
    ]
]
# PDFs that name a course but aren't syllabi: TA and marker postings, samples, posters.
NOISE = re.compile(
    r"(?i)(ta\d*.?postings?|teaching-assistant|[/_ -]ta-\d|[_ ]ta\d|job-postings|employment|marker|assignment_sample|poster|"
    r"minutes|newsletter|exam.schedule|timetable)"
)
COURSE_IN_NAME = re.compile(r"(?<![A-Za-z])([A-Za-z]{3,5})[\s_\-.]*([1-9]\d{3})(?!\d)")
SUBJECT_ALIASES = {"BIO": "BIOL", "PSYC": "PSYO", "PHYS": "PHYC", "CHEMISTRY": "CHEM"}
LOOKS_LIKE_SYLLABUS = re.compile(r"(?i)(grad(e|ing)|assessment|evaluation|marks|weight)")

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "is_syllabus", "course_codes", "term_season", "term_year", "instructors",
        "grading_schemes", "textbooks", "policies", "weekly_topics", "class_meetings",
    ],
    "properties": {
        "is_syllabus": {
            "type": "boolean",
            "description": "True only for a syllabus or course outline for a specific offering of a course.",
        },
        "course_codes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Codes this syllabus is for, written like CSCI2110. Include cross-listings, not prerequisites or exclusions.",
        },
        "term_season": {"type": ["string", "null"], "enum": ["Fall", "Winter", "Summer", "Full year", None]},
        "term_year": {"type": ["integer", "null"], "description": "Calendar year the term starts in."},
        "instructors": {"type": "array", "items": {"type": "string"}, "description": "Full names, no titles."},
        "grading_schemes": {
            "type": "array",
            "description": "Usually one. More than one only when the syllabus offers alternative schemes.",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["label", "components"],
                "properties": {
                    "label": {"type": ["string", "null"], "description": "e.g. 'Scheme II: if it helps you', or null."},
                    "components": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["name", "weight", "count", "note"],
                            "properties": {
                                "name": {"type": "string", "description": "Short: 'Final exam', 'Labs', 'Online assignments'."},
                                "weight": {"type": ["number", "null"], "description": "Percent of the final grade."},
                                "count": {"type": ["integer", "null"], "description": "How many, if stated."},
                                "note": {"type": ["string", "null"], "description": "Under 15 words: 'best 8 of 10', 'cumulative', 'Feb 28'."},
                            },
                        },
                    },
                },
            },
        },
        "textbooks": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "authors", "required", "free"],
                "properties": {
                    "title": {"type": "string"},
                    "authors": {"type": ["string", "null"]},
                    "required": {"type": ["boolean", "null"]},
                    "free": {"type": ["boolean", "null"], "description": "Open textbook or provided at no cost."},
                },
            },
        },
        "policies": {
            "type": "array",
            "description": "Course-specific rules a student would want to know: late work, missed tests, calculators, attendance. Skip standard university statements.",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["topic", "summary"],
                "properties": {
                    "topic": {"type": "string", "description": "One or two words: 'Late work', 'Missed midterm'."},
                    "summary": {"type": "string", "description": "One plain sentence, under 25 words."},
                },
            },
        },
        "weekly_topics": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["when", "topic"],
                "properties": {"when": {"type": "string"}, "topic": {"type": "string"}},
            },
        },
        "class_meetings": {
            "type": ["string", "null"],
            "description": "How the class meets each week, under 15 words, e.g. '3 lectures and 1 lab a week' or 'online, asynchronous'. Null if the syllabus doesn't say.",
        },
    },
}
INSTRUCTIONS = (
    "You read Dalhousie University course syllabi and extract facts for students choosing courses. "
    "Use only what the document says; use null or an empty list when something isn't stated. "
    "Keep wording short and plain."
)


def normalize(url: str) -> str:
    url = urllib.parse.unquote(urllib.parse.unquote(url)).replace(":80/", "/")
    return re.sub(r"^http://", "https://", url)


def courses_in(url: str, known: set[str]) -> set[str]:
    name = url.rsplit("/", 1)[-1]
    codes = set()
    for subject, number in COURSE_IN_NAME.findall(name):
        subject = SUBJECT_ALIASES.get(subject.upper(), subject.upper())
        if subject + number in known:
            codes.add(subject + number)
    return codes


def syllabus_courses(url: str, model_codes: list[str], known: set[str]) -> list[str]:
    """The model's courses (cross-listings included) plus any in the file name. When none of the
    model's courses match the file name, it misread the number (2113 as 2110) and the file name wins.
    A cross-listing (NESC3270 for PSYO3270) or grad pair (OCEA5320 for OCEA4320) counts as a match."""
    named = courses_in(url, known)
    found = {code.replace(" ", "").upper() for code in model_codes} & known

    def related(a: str, b: str) -> bool:
        return a[4:] == b[4:] or (a[:4] == b[:4] and a[5:] == b[5:])

    if named and not any(related(code, name) for code in found for name in named):
        return sorted(named)
    return sorted(found | named)


def year_in(url: str) -> int | None:
    years = [int(year) for year in re.findall(r"(?<!\d)(20[0-3]\d)(?!\d)", url.split("/", 3)[-1])]
    return max(years) if years else None


def from_wayback() -> set[str]:
    urls = set()
    for prefix, pattern in CDX_QUERIES:
        params = {
            "url": prefix, "matchType": "prefix", "filter": f"original:{pattern}",
            "collapse": "urlkey", "fl": "original", "limit": 200_000,
        }
        for attempt in range(5):  # the CDX server often drops long responses
            try:
                response = requests.get(CDX_URL, params=params, timeout=300)
                response.raise_for_status()
                break
            except requests.RequestException:
                if attempt == 4:
                    raise
                time.sleep(10 * (attempt + 1))
        urls |= {line.strip() for line in response.text.splitlines() if line.strip()}
    return urls


def from_live_site(max_pages: int) -> set[str]:
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    seen, queue, pdfs = set(CRAWL_START), list(CRAWL_START), set()

    def links(url: str) -> list[str]:
        try:
            response = session.get(url, timeout=20)
        except requests.RequestException:
            return []
        if response.status_code != 200 or "html" not in response.headers.get("content-type", ""):
            return []
        found = []
        for href in re.findall(r'href="([^"#]+)"', response.text):
            link = urllib.parse.urljoin(url, href.split("?")[0])
            if re.search(r"\.pdf$", link, re.I):
                pdfs.add(link)
            elif (
                link.startswith("https://www.dal.ca/faculty/")
                and link.endswith(".html")
                and "/news/" not in link
                and "/events/" not in link
            ):
                found.append(link)
        return found

    crawled = 0
    with ThreadPoolExecutor(6) as pool:
        while queue and crawled < max_pages:
            batch, queue = queue[:24], queue[24:]
            for found in pool.map(links, batch):
                for link in found:
                    if link not in seen:
                        seen.add(link)
                        queue.append(link)
            crawled += len(batch)
            time.sleep(0.3)
    print(f"  crawled {crawled} pages, {len(queue)} left unvisited", file=sys.stderr)
    return pdfs


def candidates(known: set[str], since: int, max_pages: int) -> dict[str, dict]:
    """Normalized URL -> {url, courses, year}, keeping the live URL when both sources have it."""
    live = from_live_site(max_pages)
    archived = from_wayback()
    print(f"  {len(live)} PDFs linked on dal.ca, {len(archived)} files in the Wayback index", file=sys.stderr)
    found = {}
    for url in list(archived) + list(live):  # live last so it wins
        key = normalize(url)
        if NOISE.search(key) or not re.search(r"\.pdf$", key, re.I):
            continue
        codes, year = courses_in(key, known), year_in(key)
        if codes and year and year >= since:
            found[key] = {"url": url if url in live else key, "live": url in live, "courses": sorted(codes), "year": year}
    return found


def download(session: requests.Session, url: str) -> tuple[bytes | None, str | None]:
    for source, target in (("dal.ca", url), ("wayback", f"https://web.archive.org/web/2026id_/{url}")):
        try:
            response = session.get(target, timeout=60)
        except requests.RequestException:
            continue
        if response.ok and response.content[:5] == b"%PDF-":
            return response.content, source
    return None, None


def pdf_text(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract(session: requests.Session, key: str, text: str) -> tuple[dict, dict]:
    body = {
        "model": MODEL,
        "instructions": INSTRUCTIONS,
        "input": text,
        "reasoning": {"effort": "low"},
        "text": {"format": {"type": "json_schema", "name": "syllabus", "strict": True, "schema": SCHEMA}},
    }
    for attempt in range(5):
        try:
            response = session.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {key}"},
                json=body,
                timeout=180,
            )
        except requests.RequestException as error:
            response = error
            time.sleep(2 ** attempt * 2)
            continue
        if response.status_code == 429 or response.status_code >= 500:
            time.sleep(2 ** attempt * 2)
            continue
        response.raise_for_status()
        result = response.json()
        output = next(
            part["text"]
            for item in result["output"]
            if item["type"] == "message"
            for part in item["content"]
            if part["type"] == "output_text"
        )
        return json.loads(output), result["usage"]
    raise RuntimeError(f"OpenAI kept failing: {getattr(response, 'text', response)}")


def weights_add_up(details: dict) -> bool:
    """Every scheme's weights total 95-105% (bonus marks and rounding aside)."""
    schemes = details.get("grading_schemes") or []
    return bool(schemes) and all(
        95 <= sum(component["weight"] or 0 for component in scheme["components"]) <= 105 for scheme in schemes
    )


def to_row(url: str, row: dict, known: set[str]) -> dict:
    details = row["details"]
    return {
        "source_url": row["url"],
        "archived": row["fetched_from"] == "wayback",
        "course_codes": syllabus_courses(url, details["course_codes"], known) or row["courses"],
        "term_season": details["term_season"],
        "term_year": row["year"],
        "instructors": details["instructors"],
        "grading_schemes": details["grading_schemes"],
        "weights_add_up": row["weights_add_up"],
        "textbooks": details["textbooks"],
        "policies": details["policies"],
        "weekly_topics": details["weekly_topics"],
        "class_meetings": details["class_meetings"],
        "model": MODEL,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--out", required=True, help="JSON file of results; also the cache")
    parser.add_argument("--since", type=int, default=2023, help="oldest year to keep (default 2023)")
    parser.add_argument("--limit", type=int, help="only process this many new documents")
    parser.add_argument("--max-pages", type=int, default=8000, help="dal.ca pages to crawl")
    parser.add_argument("--save", action="store_true", help="save the syllabi in --out to Supabase and stop")
    args = parser.parse_args()

    if args.save:
        results = json.loads(Path(args.out).read_text())
        known = set(json.loads((ROOT / "database" / "search.json").read_text()))
        rows = [
            to_row(url, row, known) for url, row in results.items()
            if row["status"] == "syllabus" and row["year"] >= args.since
        ]
        Table(load_env(), "syllabi").upsert(rows, on_conflict="source_url")
        print(f"Saved {len(rows)} syllabi to Supabase", file=sys.stderr)
        return

    key = load_env().get("OPENAI_API_KEY") or sys.exit("Set OPENAI_API_KEY")
    known = set(json.loads((ROOT / "database" / "search.json").read_text()))
    out = Path(args.out)
    results = json.loads(out.read_text()) if out.exists() else {}

    print("Finding syllabi", file=sys.stderr)
    found = candidates(known, args.since, args.max_pages)
    todo = [
        (url, info) for url, info in sorted(found.items())
        if url not in results or results[url]["status"] == "error"
    ]
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(found)} candidates since {args.since}, {len(todo)} new to process", file=sys.stderr)

    lock = threading.Lock()
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    usage = Counter()

    def process(item: tuple[str, dict]) -> None:
        url, info = item
        row, details = {**info, "status": None}, None
        data, row["fetched_from"] = download(session, info["url"])
        if not data:
            row["status"] = "unavailable"
        else:
            try:
                text = pdf_text(data)
            except Exception:  # pypdf raises many kinds of errors on broken files
                text = ""
            if len(text) < 1500 or not LOOKS_LIKE_SYLLABUS.search(text):
                row["status"] = "not a syllabus (no text or no grading words)"
            else:
                try:
                    details, used = extract(session, key, text[:MAX_TEXT])
                except Exception as error:  # left as an error and retried on the next run
                    row["status"], row["error"] = "error", str(error)[:300]
            if details:
                row["truncated"] = len(text) > MAX_TEXT
                row["status"] = "syllabus" if details["is_syllabus"] else "not a syllabus (model)"
                row["courses"] = syllabus_courses(url, details["course_codes"], known) or info["courses"]
                row["year"] = details["term_year"] or info["year"]
                row["weights_add_up"] = weights_add_up(details)
                row["details"] = details
                with lock:
                    usage.update(input=used["input_tokens"], output=used["output_tokens"])
        with lock:
            results[url] = row
            done = len(results)
            if done % 25 == 0:
                out.write_text(json.dumps(results, indent=1, ensure_ascii=False))
                print(f"  {done} processed, {usage['input']:,} in / {usage['output']:,} out tokens", file=sys.stderr)

    with ThreadPoolExecutor(8) as pool:
        list(pool.map(process, todo))
    out.write_text(json.dumps(results, indent=1, ensure_ascii=False))

    statuses = Counter(row["status"] for row in results.values())
    syllabi = [row for row in results.values() if row["status"] == "syllabus" and row["year"] >= args.since]
    courses = {code for row in syllabi for code in row["courses"]}
    cost = usage["input"] / 1e6 * 0.10 + usage["output"] / 1e6 * 0.50
    print(f"{dict(statuses)}", file=sys.stderr)
    print(
        f"{len(syllabi)} syllabi since {args.since} covering {len(courses)} courses; "
        f"weights add up in {sum(row['weights_add_up'] for row in syllabi)}. "
        f"This run: {usage['input']:,} in / {usage['output']:,} out tokens, about ${cost:.2f}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
