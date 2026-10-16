# E · Hybrid: C's layout + D's look

The owner liked two earlier directions:
- **C · Workspace** (`mockups/c-workspace/`): the *layout*. It's an app shell with a persistent sidebar listing your active
  courses, ⌘K search, split panes, an inspector panel, and dense but organized content.
- **D · Bento** (`mockups/d-bento/`): the *look*. Light cool-gray canvas, white rounded tiles, soft diffuse shadows,
  Plus Jakarta Sans with heavy headings, gold primary buttons, dark-slate selected toggles, pastel course colors,
  chunky icon badges, and playful-but-tasteful details.

Hybrid = C's information architecture and component layout, rendered entirely in D's visual language.
Study the corresponding C page for structure and the D pages for styling before you start.

## Shared shell (already built, don't edit)
- `_parts/head.html`: Tailwind config + CSS tokens/classes, `_parts/aside.html`: sidebar,
  `_parts/sprite.html`: Lucide icon sprite (`<svg class="i"><use href="#i-search"/></svg>`; list the ids with
  `grep -o 'id="i-[a-z0-9-]*"' _parts/sprite.html`). If you need an icon that isn't there, inline an `<svg>` in your own file.
- You write only `_parts/<page>.main.html` (one `<main>` element) and optionally `_parts/<page>.css` (page-specific CSS).
- Build: `python3 _parts/build.py <page>` (run from `mockups/e-hybrid/`) → `<page>.html`.
- Screenshot: `sh _parts/shot.sh <page> <height>` → `<page>.png` (1440 wide, 2x). Pick the height so the page ends
  cleanly; the sidebar is `h-screen` sticky so it spans the window height.

## Tokens and classes available (from head.html)
- Colors: `page` #F5F6F8, `ink`, `gold` (DEFAULT/50/100/200/600/700), pastel sets `butter|sky|lilac|mint|peach|rosy` each with
  `-bg`, `-ink`, `-dot` (e.g. `bg-mint-bg text-mint-ink`). Shadows: `shadow-tile`, `shadow-float`, `shadow-pill`, `shadow-gold`.
- Classes: `.tile` (white, 24px radius, soft shadow), `.tile-sm` (18px), `.well` (gray inset, 16px), `.badge` / `.badge-sm`
  (rounded-square icon badges), `.kbd`, `.page-glow`, `.caret`, `.tnum`, `.i/.i-sm/.i-xs/.i-lg` icons.
- Course color scoping: put `c-butter|c-sky|c-lilac|c-mint|c-peach|c-rosy` on an element, then use `.ev` (calendar block),
  `.tag`, `.dot`, `.cbg`, `.cink` inside it. `.conflict` = rose ring, `.hatch` = rose hatching.

## Page skeleton (match this so all pages line up)
```html
<main class="relative min-w-0 flex-1 pb-8 pr-6 pt-5">
  <div class="page-glow pointer-events-none absolute inset-x-0 top-0 h-[260px]"></div>
  <header class="relative flex h-11 items-center gap-3">  <!-- breadcrumb left (14px semibold slate-500, current item ink) -->
    ... <div class="ml-auto flex items-center gap-2"> page actions + term pill </div>
  </header>
  ... content: tiles with gap-5 ...
</main>
```
Term pill (use the same everywhere):
`<button class="flex h-10 items-center gap-2 rounded-full bg-white pl-3 pr-3.5 text-[13.5px] font-bold shadow-pill ring-1 ring-slate-900/5"><span class="h-2 w-2 rounded-full bg-gold"></span>Winter 2026<svg class="i i-xs text-slate-400"><use href="#i-chev-updown"/></svg></button>`

## Style rules
- Plus Jakarta Sans everywhere; headings 700–800 with tight tracking; times, counts and CRNs use `.tnum`. No monospace font.
- Pills fully rounded; tiles 24px; inner cards 16–18px. Gold = primary action/active only. Dark slate (`bg-ink text-white`)
  for selected segmented controls/toggles. Red/rose only for conflicts.
- Airy but information-rich: C's density of real data, with D's breathing room. No decorative fluff that doesn't carry data.

## Canonical data (must be identical on every page)
"Now" is **Wed Feb 11, 2026, 10:50 AM**, Week 6 of 13, term Winter 2026 (202620). The user is Théo.
Right now Théo is in CSCI 2122 Lab B03 (10:05–11:25); next is CSCI 2122 Lec 01 at 11:35.

Schedule, Winter 2026, 15 credit hours, 5 courses (color in brackets):
- CSCI 2122 Systems Programming [butter]: Lec 01 Mon/Wed 11:35–12:55 Goldberg CS 127 (CRN 20756, Kalyaniwalla N.);
  Lab B03 Wed 10:05–11:25 Goldberg CS 134 (CRN 20761)
- CSCI 2110 Data Structures & Algorithms [sky]: Lec 01 Mon/Wed/Thu/Fri 16:35–17:25 Goldberg CS 127 (CRN 20748, Sampalli S.);
  Lab B02 Wed 8:35–9:55 Goldberg CS 143 (CRN 20751)
- CSCI 2141 Intro to Database Systems [lilac]: Lec 01 Tue/Thu 13:05–14:25 Rowe 1020 (CRN 20770, Aziz K.)
- STAT 2060 Intro Probability & Stats [mint]: Lec 01 Mon/Wed/Thu/Fri 14:35–15:25 Dunn 117 (CRN 22965, Murphy O.);
  Tut T01 Tue 8:35–10:25 Henry Hicks 217 (CRN 22966)
- ECON 1101 Principles of Microeconomics [peach]: Lec 01 Tue/Thu 14:35–15:55 Rowe 1020 (CRN 20950, Ntantamis C.)
- **Exactly one conflict:** STAT 2060 Lec 01 × ECON 1101 Lec 01 on **Thursday 14:35–15:25 (50 min overlap)**.
  Neither has another Winter 2026 section; ECON 1101 is also offered Fall 2026. (Sidebar shows a "1" badge on Schedule.)

CSCI 2122 details: 3 credit hours, 2000 level, Studley campus, prereqs CSCI 1110 + CSCI 1120, unlocks CSCI 3120 Operating Systems.
Enrollment 101/120 (19 seats left). Sections W26: Lec 01 (above, 101/120), Lec 90 Online / Consult Department (CRN 20758, Wijenayake U.),
Lab B03 (above, 52/60), Lab B04 Mon 13:05–14:25 Goldberg CS 134 (CRN 20762, 49/60, fits the schedule, so it's a valid swap).
Also offered Fall 2026 and Winter 2027 (Kalyaniwalla N.), not Summer 2026.
Description: "This course presents tools, techniques, and concepts for systems programming. Students will be exposed to assembly
and will be introduced to the C programming language. The course also discusses memory hierarchies, performance measurement,
exception control flow, and performance related issues. Students will be involved in significant amount of low-level programming."

Ratings: Kalyaniwalla N. RMP 2.4/5, 61% would take again, difficulty 4.1. Wijenayake U.: no RMP ratings yet.
Sampalli S. 4.2, Aziz K. 3.7, Murphy O. 4.1, Ntantamis C. 3.9, Ye Q. 4.1, Wilde N. 3.6, Rahman M. 3.2.
CSCI 2122 student reviews: 38 reviews, Overall 3.4, Difficulty 4.2 (Hard), Workload 4.4 (Heavy).
Other courses (for lists): CSCI 3120 Operating Systems (Tue/Thu 8:35–9:55, Tupper Theatre B, 117/150, Ye Q.; CONFLICT with STAT 2060 Tut T01 on Tue),
CSCI 3110 Algorithms I (Lec Tue/Thu 10:05–11:25, Goldberg CS 127, 78/120, Wilde N.; CONFLICT with STAT 2060 Tut T01 on Tue 10:05–10:25),
CSCI 3130 Intro to Software Engineering (Lec Tue/Thu 13:05–14:25, 136/150, Rahman M.; CONFLICT with CSCI 2141 Lec 01).
Site stats: 4,689 courses · 167 subjects · 680 instructors rated.

## Rules
- Only write inside `mockups/e-hybrid/` and only your own page's files. Don't edit head.html, aside.html, sprite.html, build.py, shot.sh.
- Don't commit, don't start dev servers.
- Review your screenshot by reading the PNG and iterate (2–3 passes) until it's genuinely polished: alignment, spacing rhythm,
  consistent radii, nothing cut off or overflowing, no awkward empty areas.
