"""Find a university's public syllabi and pull the useful parts out of them with GPT-6 Luna.

At Dal:

Departments post syllabus PDFs on cdn.dal.ca and link them from their pages on www.dal.ca.
Candidates come from two places: the Wayback Machine's index of Dal files (older uploads)
and a crawl of the live faculty pages (current ones). A PDF is kept when its file name has
one of Dal's courses in Supabase and a year on or after --since. Each one is downloaded,
its text is sent to the model, and what comes back (grading, assessments, textbooks,
policies, weekly topics) is recorded in the syllabus_documents table. The PDF text itself
isn't kept.

At MSVU, the few public course outlines are uploads on msvu.ca, found through the Wayback index.

    python3 syllabi.py                          # find and extract new ones at Dal
    python3 syllabi.py --save                   # then publish them to the syllabi table the site reads
    python3 syllabi.py --university msvu        # the same at MSVU

Run it at the start of each term, when departments post new syllabi.

syllabus_documents doubles as a cache: documents already in it aren't downloaded or sent again.
Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, and OPENAI_API_KEY unless saving, from
the environment or the repo's .env.local.
"""

from __future__ import annotations

import argparse
import html
import io
from email.utils import parsedate_to_datetime
import json
import logging
import re
import sys
import threading
import time
import urllib.parse
from pathlib import Path
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

import requests
from pypdf import PdfReader

from supabase_rest import Table, load_env

MODEL = "gpt-6-luna"
UNIVERSITY_NAMES = {"dal": "Dalhousie University", "msvu": "Mount Saint Vincent University"}
USER_AGENT = "Mozilla/5.0 (compatible; Termly syllabus indexer; +https://termly.ca)"
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

# What to pull out of a syllabus, shared with the upload flow in src/lib/syllabus-extraction.ts.
EXTRACTION = json.loads((Path(__file__).resolve().parents[2] / "lib" / "syllabus-extraction.json").read_text())
SCHEMA = EXTRACTION["schema"]
INSTRUCTIONS = EXTRACTION["instructions"]


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


def from_wayback(queries: list[tuple[str, str]] = CDX_QUERIES) -> set[str]:
    urls = set()
    for prefix, pattern in queries:
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


# Syllabi outside dal.ca that a crawl wouldn't find: instructors' course repos and GitHub Pages
# sites, and official syllabi that students committed to their repos. Re-checked every run.
LISTED_SYLLABI = {
    "https://raw.githubusercontent.com/MAPS-Lab/CSCI-3141/HEAD/assets/syllabus.pdf": {"CSCI3141"},
    "https://maguire-lab.github.io/bioinformatics_algorithms_2026/static_files/Bioinformatics_Algorithms_Syllabus_Winter_2025_2026.pdf": {"CSCI4181", "CSCI6802"},
    "https://maguire-lab.github.io/bioinformatics_algorithms/static_files/Bioinformatics_Algorithms_Syllabus_Winter_2022_2023.pdf": {"CSCI4181", "CSCI6802"},
    "https://raw.githubusercontent.com/maguire-lab/scientific_computing/HEAD/static_files/csci2202_2024_2025_syllabus_update.pdf": {"CSCI2202"},
    **{
        f"https://raw.githubusercontent.com/maguire-lab/health_data_science_research_2026/HEAD/static_files/{year}_syllabus.pdf": {"CSCI4148", "CSCI6410"}
        for year in (2023, 2024, 2025, 2026)
    },
    "https://travislacroix.github.io/files/LaCroix-Dalhousie-PHIL-2490-CSCI-3101-Winter-2024-Syllabus.pdf": {"CSCI3101", "PHIL2490"},
    "https://raw.githubusercontent.com/Faizaumatiya/DalhousieUniversity_CSCI-5409_CloudComputing/HEAD/Syllabus.pdf": {"CSCI4145", "CSCI5409"},
    "https://raw.githubusercontent.com/Faizaumatiya/DalhousieUniversity_CSCI5709_WEB/HEAD/Syllabus.pdf": {"CSCI4177", "CSCI5709"},
}

CS_HOME = re.compile(r"https?://(?:web|www)?\.?cs\.dal\.ca(?::80)?/~([^/?#]+)")
CS_COURSE = re.compile(r"(?i)(?<![a-z])(?:csci|cs)[\s_\-]*([1-9]\d{3})(?!\d)")
BARE_NUMBER = re.compile(r"(?<!\d)([1-9]\d{3})(?!\d)")
SYLLABUS_WORDS = re.compile(r"(?i)(syllab|outline|course[-_ ]?info)")
TEACHING_WORDS = re.compile(r"(?i)(teach|courses?\b|classes)")


def from_cs_home_pages(known: set[str]) -> dict[str, set[str]]:
    """Syllabus PDFs and syllabus-like course pages in instructors' folders on web.cs.dal.ca,
    with the courses they're for.

    Computer Science barely posts syllabi on dal.ca; instructors keep them in their own folders,
    named things like syllabus.pdf or syllabus_2122.pdf. The folders come from the Wayback index
    (the server doesn't list them), and each live one is crawled a few links deep, including
    directory listings and the JSON files that some JavaScript course sites load their links from.
    """
    response = requests.get(
        CDX_URL,
        params={"url": "web.cs.dal.ca/~", "matchType": "prefix", "collapse": "urlkey", "fl": "original", "limit": 500_000},
        timeout=300,
    )
    response.raise_for_status()
    # Course pages the archive knows about are crawled too: home pages often don't link to them.
    known_pages: dict[str, list[str]] = {}
    for line in response.text.splitlines():
        match = CS_HOME.match(line)
        if not match:
            continue
        pages = known_pages.setdefault(match.group(1), [])
        page = normalize(line)
        if re.search(r"(/|\.html?)$", page) and CS_COURSE.search(page) and len(pages) < 15:
            pages.append(page.replace("://www.cs.", "://web.cs.").replace("://cs.", "://web.cs."))

    def courses(*texts: str) -> set[str]:
        found = set()
        for text in texts:
            text = urllib.parse.unquote(text)
            found |= {f"CSCI{number}" for number in CS_COURSE.findall(text)}
            found |= {f"CSCI{number}" for number in BARE_NUMBER.findall(text.rsplit("/", 1)[-1])}
        return found & known

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    pdfs: dict[str, set[str]] = {}

    def crawl(user: str) -> None:
        home = f"https://web.cs.dal.ca/~{user}/"
        # (page, depth, courses named in the link that led here)
        queue: list[tuple[str, int, set[str]]] = [(page, 0, set()) for page in [home, *known_pages[user]]]
        seen = {page for page, _, _ in queue}
        while queue and len(seen) < 60:
            page, depth, linked_codes = queue.pop(0)
            try:
                response = session.get(page, timeout=15)
            except requests.RequestException:
                continue
            if response.status_code != 200 or "html" not in response.headers.get("content-type", ""):
                continue
            # Some course pages are the syllabus: they give the grading right on the page.
            title = re.search(r"(?is)<(title|h1)[^>]*>(.*?)</\1>", response.text)
            page_codes = (
                courses(page)
                or {f"CSCI{number}" for number in CS_COURSE.findall(title.group(2) if title else "")} & known
                or linked_codes
            )
            if page_codes and len(re.findall(r"\d\s?%", response.text)) >= 2 and LOOKS_LIKE_SYLLABUS.search(response.text):
                pdfs.setdefault(page, set()).update(page_codes)
            links = [
                (urllib.parse.urljoin(page, href.strip()), re.sub(r"<[^>]+>", " ", label))
                for href, label in re.findall(r'(?is)<a[^>]+href=["\']([^"\'#?]+)["\'][^>]*>(.*?)</a>', response.text)
            ]
            for data in re.findall(r'["\'](?:\./)?((?:data/)?[\w-]+\.json)["\']', response.text)[:5]:
                try:
                    listed = session.get(urllib.parse.urljoin(page, data), timeout=15).json()
                except (requests.RequestException, ValueError):
                    continue
                for item in listed.get("quickLinks", []) if isinstance(listed, dict) else []:
                    if item.get("url", "").lower().endswith(".pdf"):
                        links.append((urllib.parse.urljoin(page, item["url"]), item.get("label", "")))
            for link, label in links:
                if not link.startswith(home):
                    continue
                if link.lower().endswith(".pdf"):
                    if SYLLABUS_WORDS.search(link + " " + label):
                        codes = courses(link, label) or courses(page)
                        if codes:
                            pdfs.setdefault(link, set()).update(codes)
                elif depth < 3 and link not in seen and (
                    courses(link, label) or SYLLABUS_WORDS.search(link + label) or TEACHING_WORDS.search(link + label)
                ):
                    seen.add(link)
                    label_codes = {f"CSCI{number}" for number in CS_COURSE.findall(label)} & known
                    queue.append((link, depth + 1, label_codes))

    with ThreadPoolExecutor(6) as pool:
        list(pool.map(crawl, sorted(known_pages)))
    print(f"  {len(known_pages)} instructor folders on web.cs.dal.ca, {len(pdfs)} syllabus PDFs", file=sys.stderr)
    return pdfs


def candidates(known: set[str], since: int, max_pages: int) -> dict[str, dict]:
    """Normalized URL -> {url, courses, year}, keeping the live URL when both sources have it."""
    live = from_live_site(max_pages)
    archived = from_wayback()
    print(f"  {len(live)} PDFs linked on dal.ca, {len(archived)} files in the Wayback index", file=sys.stderr)
    found = {}
    # Instructor folders often leave the year out of file names; the model reads it from the PDF.
    listed = {url: codes & known for url, codes in LISTED_SYLLABI.items()}
    for url, codes in {**from_cs_home_pages(known), **listed}.items():
        year = year_in(url)
        if not year or year >= since:
            found[normalize(url)] = {"url": url, "live": True, "courses": sorted(codes), "year": year}
    for url in list(archived) + list(live):  # live last so it wins
        key = normalize(url)
        if NOISE.search(key) or not re.search(r"\.pdf$", key, re.I):
            continue
        codes, year = courses_in(key, known), year_in(key)
        if codes and year and year >= since:
            found[key] = {"url": url if url in live else key, "live": url in live, "courses": sorted(codes), "year": year}
    return found


# MSVU names outlines "1188-Outline-W26-Moniz.pdf" or "PBRL-2299-01-Course-Outline-Shaffner-F24.pdf": the
# subject can be missing and the term is a season letter and two digits.
MSVU_CDX_QUERIES = [("msvu.ca/wp-content/uploads/", r"(?i).*(syllab|outline).*\.pdf.*")]
SEASON_YEAR = re.compile(r"(?i)(?<![a-z0-9])(?:S|F|W|SU|FA|WI)(\d{2})(?![0-9])")
BARE_NUMBER = re.compile(r"(?<![A-Za-z0-9])([1-9]\d{3})(?![0-9])")


def msvu_candidates(known: set[str], since: int, max_pages: int) -> dict[str, dict]:
    """MSVU's public course outlines: uploads on msvu.ca named with "outline" or "syllabus". A bare
    course number names the course when only one MSVU course has it; when several do (co-op terms are
    BUSI, PBRL and THMT 1188), the model reads the course from the outline instead."""
    by_number: dict[str, set[str]] = {}
    for code in known:
        by_number.setdefault(re.sub(r"^[A-Z]+", "", code), set()).add(code)
    found = {}
    for url in from_wayback(MSVU_CDX_QUERIES):
        key = normalize(url)
        name = key.rsplit("/", 1)[-1]
        if NOISE.search(name) or not name.lower().endswith(".pdf"):
            continue
        codes = courses_in(key, known)
        numbers = [number for number in BARE_NUMBER.findall(name) if number in by_number]
        if not codes:
            codes = {next(iter(by_number[number])) for number in numbers if len(by_number[number]) == 1}
        # The upload folder's year is when the slot was made, not the term, so only the file name counts.
        years = [int(year) for year in re.findall(r"(?<!\d)(20[0-3]\d)(?!\d)", name)]
        years += [2000 + int(year) for year in SEASON_YEAR.findall(name)]
        year = max(years) if years else None
        if (codes or numbers) and year and year >= since:
            found[key] = {"url": key, "live": False, "courses": sorted(codes), "year": year}
    print(f"  {len(found)} MSVU outlines since {since}", file=sys.stderr)
    return found


SOURCES = {"dal": candidates, "msvu": msvu_candidates}


def download(session: requests.Session, url: str) -> tuple[bytes | None, str | None]:
    for source, target in (("dal.ca", url), ("wayback", f"https://web.archive.org/web/2026id_/{url}")):
        try:
            response = session.get(target, timeout=60)
        except requests.RequestException:
            continue
        if response.ok and response.content[:5] == b"%PDF-":
            return response.content, source
    return None, None


def page_text(session: requests.Session, url: str) -> tuple[str | None, int | None]:
    """The readable text of an HTML course page, or None if it can't be fetched, and the year it
    was last changed. Course pages often say "Term: TBA", so that year stands in for the term's."""
    try:
        response = session.get(url, timeout=60)
    except requests.RequestException:
        return None, None
    if not response.ok or "html" not in response.headers.get("content-type", ""):
        return None, None
    try:
        modified = parsedate_to_datetime(response.headers["last-modified"]).year
    except (KeyError, TypeError, ValueError):
        modified = None
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", response.text)
    text = re.sub(r"(?i)<(br|p|div|li|tr|h\d)[^>]*>", "\n", text)
    return html.unescape(re.sub(r"<[^>]+>", " ", text)), modified


def pdf_text(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract(session: requests.Session, key: str, text: str, university: str) -> tuple[dict, dict]:
    body = {
        "model": MODEL,
        "instructions": INSTRUCTIONS.format(university=UNIVERSITY_NAMES[university]),
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


def to_row(url: str, row: dict, known: set[str], university: str) -> dict:
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
        "university_id": university,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--university", default="dal", choices=sorted(SOURCES), help="university id (default dal)")
    parser.add_argument("--since", type=int, default=2023, help="oldest year to keep (default 2023)")
    parser.add_argument("--limit", type=int, help="only process this many new documents")
    parser.add_argument("--max-pages", type=int, default=8000, help="dal.ca pages to crawl")
    parser.add_argument("--save", action="store_true", help="publish the recorded syllabi to the syllabi table and stop")
    args = parser.parse_args()

    env = load_env()
    courses = Table(env, "courses").select_all("code", {"university_id": f"eq.{args.university}"}, "code")
    known = {course["code"] for course in courses}
    if not known:
        sys.exit(f"No {args.university} courses stored; refresh the timetable first")
    documents = Table(env, "syllabus_documents")
    results = {
        row["url"]: row["data"]
        for row in documents.select_all("url,data", {"university_id": f"eq.{args.university}"}, "url")
    }

    if args.save:
        rows = [
            to_row(url, row, known, args.university) for url, row in results.items()
            if row["status"] == "syllabus" and (row["year"] or 0) >= args.since
        ]
        # Outlines the model couldn't tie to a course can't be shown on any course page.
        rows = [row for row in rows if row["course_codes"]]
        Table(env, "syllabi").upsert(rows, on_conflict="source_url")
        print(f"Saved {len(rows)} syllabi to Supabase", file=sys.stderr)
        return

    key = env.get("OPENAI_API_KEY") or sys.exit("Set OPENAI_API_KEY")

    print("Finding syllabi", file=sys.stderr)
    found = SOURCES[args.university](known, args.since, args.max_pages)
    todo = [
        (url, info) for url, info in sorted(found.items())
        if url not in results or results[url]["status"] == "error"
    ]
    if args.limit:
        todo = todo[: args.limit]
    print(f"{len(found)} candidates since {args.since}, {len(todo)} new to process", file=sys.stderr)

    lock = threading.Lock()
    unsaved: dict[str, dict] = {}

    def flush() -> None:
        rows = [
            {"url": url, "university_id": args.university, "status": row["status"], "data": row}
            for url, row in unsaved.items()
        ]
        documents.upsert(rows, on_conflict="url")
        unsaved.clear()
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    usage = Counter()

    def process(item: tuple[str, dict]) -> None:
        url, info = item
        row, details = {**info, "status": None}, None
        if info["url"].lower().endswith(".pdf"):
            data, row["fetched_from"] = download(session, info["url"])
            try:
                text = pdf_text(data) if data else None
            except Exception:  # pypdf raises many kinds of errors on broken files
                text = ""
        else:
            (text, row["modified_year"]), row["fetched_from"] = page_text(session, info["url"]), "web page"
        if text is None:
            row["status"] = "unavailable"
        else:
            if len(text) < 1500 or not LOOKS_LIKE_SYLLABUS.search(text):
                row["status"] = "not a syllabus (no text or no grading words)"
            else:
                try:
                    details, used = extract(session, key, text[:MAX_TEXT], args.university)
                except Exception as error:  # left as an error and retried on the next run
                    row["status"], row["error"] = "error", str(error)[:300]
            if details:
                row["truncated"] = len(text) > MAX_TEXT
                row["status"] = "syllabus" if details["is_syllabus"] else "not a syllabus (model)"
                row["courses"] = syllabus_courses(url, details["course_codes"], known) or info["courses"]
                row["year"] = details["term_year"] or info["year"] or row.get("modified_year")
                row["weights_add_up"] = weights_add_up(details)
                row["details"] = details
                with lock:
                    usage.update(input=used["input_tokens"], output=used["output_tokens"])
        with lock:
            results[url] = unsaved[url] = row
            done = len(results)
            if done % 25 == 0:
                flush()
                print(f"  {done} processed, {usage['input']:,} in / {usage['output']:,} out tokens", file=sys.stderr)

    with ThreadPoolExecutor(8) as pool:
        list(pool.map(process, todo))
    flush()

    statuses = Counter(row["status"] for row in results.values())
    syllabi = [row for row in results.values() if row["status"] == "syllabus" and (row["year"] or 0) >= args.since]
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
