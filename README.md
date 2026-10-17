# Termly

[termly.ca](https://termly.ca), formerly DalSearch. Course search and timetable planning for Dal and a dozen other Canadian universities.

Picking courses at Dal usually means flipping between the timetable, RateMyProfessors and a half-drawn week in your notes to see what overlaps. DalSearch puts it all in one place. Search any Dal course, see its sections, prerequisites and how its instructors are rated, and add what you want to your week. It tells you what fits and what clashes before you register, then copies your CRNs so registering takes a minute.

![Your week, with clashes flagged](docs/screenshots/schedule.png)

![A course, its sections and what it leads to](docs/screenshots/course.png)

![Explore, with what fits your schedule](docs/screenshots/explore.png)

![Today at a glance](docs/screenshots/home.png)

## Running it locally

Course data lives in Supabase, so you need a project to point at, either your own or a local one with `supabase start`.

1. Run the migrations in `supabase/migrations`.
2. Put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` and `SUPABASE_SECRET_KEY` in `.env.local`.
3. Load Dal's timetable: `npm ci --prefix src/scripts/node && node src/scripts/node/refresh.js dal --details none`. That takes a few minutes; drop `--details none` to also fetch every course description (about an hour).
4. `npm run dev`.

The weekly GitHub workflow runs the same refresh, then `src/scripts/py/rmp_reviews.py` for RateMyProfessors. Each university has a scraper in `src/scripts/node/universities/`; they all return the shape described in `src/scripts/node/lib/import.js`.

<sub>Not affiliated with Dalhousie University. Made by Théo Bourgeois and Chris Langille.</sub>
