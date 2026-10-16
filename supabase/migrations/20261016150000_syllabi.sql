-- What public course syllabi say: grading, textbooks, policies and weekly topics.
-- src/scripts/py/syllabi.py finds the PDFs on dal.ca (or the Wayback Machine's copy), has a
-- model pull these fields out and saves them with the secret key; the app only reads them.
-- The PDF text isn't stored, only the extracted facts and a link back to the source.

create table public.syllabi (
    id uuid primary key default gen_random_uuid(),
    source_url text not null unique,
    -- Whether the PDF was still on dal.ca when fetched, or only in the Wayback Machine.
    archived boolean not null default false,
    -- Every course the syllabus covers, cross-listings included ("BIOL3003", "OCEA3003").
    course_codes text[] not null
        check (course_codes::text ~ '^\{[A-Z]{4}[0-9]{4}(,[A-Z]{4}[0-9]{4})*\}$'),
    term_season text check (term_season in ('Fall', 'Winter', 'Summer', 'Full year')),
    term_year smallint not null check (term_year between 2000 and 2100),
    instructors text[] not null default '{}',
    -- [{label, components: [{name, weight, count, note}]}]; more than one when the course
    -- offers alternative schemes or different ones for undergrad and grad sections.
    grading_schemes jsonb not null default '[]',
    -- False when weights are missing or a scheme doesn't total about 100%.
    weights_add_up boolean not null default false,
    -- [{title, authors, required, free}]
    textbooks jsonb not null default '[]',
    -- [{topic, summary}]
    policies jsonb not null default '[]',
    -- [{when, topic}]
    weekly_topics jsonb not null default '[]',
    class_meetings text,
    model text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index syllabi_course_codes_idx on public.syllabi using gin (course_codes);

create trigger syllabi_set_updated_at before update on public.syllabi
    for each row execute function private.set_updated_at();

alter table public.syllabi enable row level security;

revoke all on public.syllabi from anon, authenticated;
grant select on public.syllabi to anon, authenticated;

create policy "Anyone reads syllabi"
    on public.syllabi for select to anon, authenticated
    using (true);
