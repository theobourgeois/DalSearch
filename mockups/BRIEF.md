# DalSearch redesign: shared mockup brief

DalSearch (dalsearch.com) is an unofficial course search tool for Dalhousie University students.
The current UI (shadcn defaults, Poppins, centered cards, blue-ish gradients) feels dated. We're building
static, high-fidelity HTML mockups of a few design directions so the owner can choose one.

## Product facts (use these, don't invent new features)
- ~4,689 courses, 167 subjects, 680 instructors with RateMyProfessors ratings.
- Terms: 2025/2026 Winter (current, term code 202620), 2025/2026 Summer, 2026/2027 Fall, 2026/2027 Winter.
- Top nav today: Explore, Rooms, Schedule, Instructors, plus a header course search, dark-mode toggle, Account.
- Course page: code + title, credit hours, description, prerequisites (linked course codes), instructors by term
  (with RMP star rating, e.g. Nauzer Kalyaniwalla 2.4/5, 61% would take again, difficulty 4.1),
  term selector, sections (Lec/Lab/Tut, section number, days, time, location, CRN, enrollment), a weekly
  calendar preview of the sections, "Add to schedule" per section, and student Ratings & Reviews
  (Overall, Difficulty, Workload sliders/stars + text, tagged with instructor).
- Explore page: filter by course level (1000–9000), term, credit hours, subject, plus "Only show classes
  that fit my schedule" (with a buffer of 0/10/15 min between classes). Results show course + sections, and
  sections conflicting with your schedule get a red "CONFLICT" tag.
- Schedule builder: weekly calendar (Mon–Fri, ~8am–6pm) of added sections, list of selected courses with
  total credit hours, term switcher, import from Dal Online, export (PNG/PDF), share link, conflict warnings.
- Rooms page: search a building/room and see its weekly occupancy. Instructors page: browse instructors with RMP ratings.
- Footer: "Not affiliated with Dalhousie University", created by Théo Bourgeois & Chris Langille, open source, Buy me a coffee.

## Real sample data
`mockups/sample-courses.json` has real courses (CSCI 2122, 2110, 3110, 3120, 3130, 2141, STAT 2060, ECON 1101)
with sections for Winter 2026. Use real codes/titles/times/rooms from it. Times are 24h strings like "1135" → 11:35 AM.

Hero course for the detail page: **CSCI 2122 Systems Programming**, 3 credit hours, prereqs CSCI 1110 + CSCI 1120,
enrollment 101/120, Winter 2026 sections:
- Lec 01: Mon & Wed 11:35–12:55, Goldberg Computer Science Bldg 127, CRN 20756
- Lec 90: Online / Consult Department, CRN 20758
- Lab B03: Wed 10:05–11:25, Goldberg CS Bldg 134, CRN 20761
- Lab B04: Mon 13:05–14:25, Goldberg CS Bldg 134, CRN 20762
Instructors W26: Kalyaniwalla N., Wijenayake U.

Sample schedule for the schedule page (Winter 2026, 15 credit hours): CSCI 2122 (Lec 01 + Lab B03),
CSCI 2110, CSCI 2141, STAT 2060, ECON 1101 — pull their real times from sample-courses.json.
If two of them overlap, show it as a conflict state, which is a realistic and useful thing to design.

## Branding
- Dalhousie gold is the brand accent (roughly #FFD400 / #F5B800; tune per direction). Wordmark is "DalSearch"
  with "Dal" emphasized.
- Logo mark: `public/dalsearch.svg` (gold magnifying glass with a dog/gargoyle inside). Reference it with a relative
  path from your html file (`../../public/dalsearch.svg`) or inline it. It's fine to simplify it to a small mark.

## Technical rules
- One self-contained HTML file per page at `mockups/<direction>/<page>.html`: `home.html`, `explore.html`,
  `course.html`, `schedule.html`.
- Use Tailwind via Play CDN (`<script src="https://cdn.tailwindcss.com"></script>`) with an inline `tailwind.config`,
  Google Fonts, and inline SVG icons (Lucide-style, 1.5–2px strokes). No build step, no JS frameworks needed.
- Design at 1440px wide. Each page should look complete at its rendered height (no half-cut content).
- Static mockups: show realistic states (a search typed into the command palette, a hovered row, a selected
  section, etc.) when it helps sell the design.
- Screenshot command (run from the repo root, adjust height per page so nothing is cut off):
  ```
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1440,1100 --virtual-time-budget=10000 \
    --screenshot=mockups/<direction>/<page>.png "file://$PWD/mockups/<direction>/<page>.html"
  ```
  Then Read the PNG to review it yourself. Iterate until it looks genuinely polished: alignment, spacing rhythm,
  type hierarchy, consistent radii, no overflowing text, no empty awkward areas, nothing that looks like a template.
- Only write inside your own `mockups/<direction>/` folder. Don't touch app source, don't commit, don't start the dev server.
