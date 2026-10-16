-- Course reviews from other sites, starting with RateMyProfessors. They aren't tied to a
-- DalSearch account, so they live apart from public.reviews and its one-review-per-student
-- rules, flags and moderation. src/scripts/py/rmp_reviews.py fills this table with the
-- secret key; the app only reads it.

create table public.external_reviews (
    id uuid primary key default gen_random_uuid(),
    source text not null check (source in ('rmp')),
    -- The review's id on the source site, so re-running the script updates instead of duplicating.
    source_id text not null,
    course_code text not null check (course_code ~ '^[A-Z]{4}[0-9]{4}$'),
    -- The course as the student wrote it ("STATS1060", "2110"), kept to check the matching.
    source_course text not null default '',
    instructor text not null,
    instructor_url text,
    review_text text,
    -- RMP's 1-5 quality score rates the professor, not the course, so it isn't a DalSearch rating.
    quality smallint check (quality between 1 and 5),
    difficulty smallint check (difficulty between 1 and 5),
    would_take_again boolean,
    grade text,
    tags text[] not null default '{}',
    attendance_mandatory boolean,
    online boolean,
    thumbs_up integer not null default 0,
    thumbs_down integer not null default 0,
    reviewed_at timestamptz not null,
    -- Set on every run; a full run deletes rows it didn't see, i.e. reviews removed from RMP.
    last_seen_at timestamptz not null default now(),
    unique (source, source_id)
);

create index external_reviews_course_code_reviewed_at_idx
    on public.external_reviews (course_code, reviewed_at desc);

alter table public.external_reviews enable row level security;

revoke all on public.external_reviews from anon, authenticated;
grant select on public.external_reviews to anon, authenticated;

create policy "Anyone reads external reviews"
    on public.external_reviews for select to anon, authenticated
    using (true);
