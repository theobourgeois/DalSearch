-- The course catalog and timetable, for any number of universities.
--
-- Until now the app read scraped JSON files committed to the repo. Everything now lives here,
-- keyed by university, and every university's scraper writes the same shape through the
-- import_* functions at the bottom (see src/scripts/node/lib/import.js for the payload).
--
-- This migration only adds things, so the site keeps working on the old code until the new
-- code is deployed: existing reviews, RMP reviews and syllabi become Dal's, and inserts that
-- don't name a university still default to Dal.

-- Universities -------------------------------------------------------------------------------

create table public.universities (
    -- A short slug, also used in URLs: 'dal', 'smu', 'msvu'.
    id text primary key check (id ~ '^[a-z0-9-]{2,32}$'),
    name text not null,
    short_name text not null,
    -- IANA zone the timetable's times are in, e.g. 'America/Halifax'.
    timezone text not null,
    website_url text,
    -- RateMyProfessors' school id, e.g. 'School-1423'.
    rmp_school_id text,
    -- What the university calls the credit a course is worth.
    credit_label text not null default 'credit hours',
    created_at timestamptz not null default now()
);

-- Students sign up with an address at one of these domains (or one in allowed_emails).
create table public.university_email_domains (
    domain text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
    university_id text not null references public.universities (id) on delete cascade
);

insert into public.universities (id, name, short_name, timezone, website_url, rmp_school_id)
values ('dal', 'Dalhousie University', 'Dal', 'America/Halifax', 'https://www.dal.ca', 'School-1423');

insert into public.university_email_domains (domain, university_id) values ('dal.ca', 'dal');

-- Terms and subjects ---------------------------------------------------------------------------

create type public.term_season as enum ('fall', 'winter', 'spring', 'summer', 'full_year', 'other');

create table public.terms (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id) on delete cascade,
    -- The university's own code ('202710' is Dal's Fall 2026). Never compared or sorted; terms
    -- are ordered by starts_on.
    code text not null check (length(code) between 1 and 32),
    name text not null check (length(name) between 1 and 100),
    season public.term_season not null,
    -- The calendar year the term starts in.
    year smallint not null check (year between 1900 and 2200),
    starts_on date not null,
    ends_on date not null check (ends_on >= starts_on),
    -- On the university's timetable right now. The app only offers listed terms; older terms
    -- stay as history.
    is_listed boolean not null default false,
    created_at timestamptz not null default now(),
    unique (university_id, code),
    unique (id, university_id)
);

create table public.subjects (
    university_id text not null references public.universities (id) on delete cascade,
    code text not null check (code ~ '^[A-Z0-9]{1,10}$'),
    -- Without the code: 'Actuarial Science'.
    name text not null,
    primary key (university_id, code)
);

-- Courses --------------------------------------------------------------------------------------

create table public.courses (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id) on delete cascade,
    -- Subject and number run together, uppercase: 'CSCI2122'. Used in URLs and by reviews.
    code text not null check (code ~ '^[A-Z0-9]{2,20}$'),
    subject_code text not null,
    -- Text, since numbers like '1A01' or '101' exist elsewhere.
    number text not null check (number ~ '^[A-Z0-9]{1,10}$'),
    title text not null check (length(title) between 1 and 300),
    credits numeric(6, 2) check (credits >= 0),
    -- Plain text from the university's calendar.
    description text,
    -- The calendar's requisite wording as written; course_requisites holds the parsed links.
    requisites_text text,
    details_updated_at timestamptz,
    first_seen_at timestamptz not null default now(),
    -- Last time the course was on the timetable. Courses are never deleted, so reviews of a
    -- course that stops running keep pointing at it.
    last_seen_at timestamptz not null default now(),
    unique (university_id, code),
    unique (id, university_id),
    check (code = subject_code || number),
    foreign key (university_id, subject_code) references public.subjects (university_id, code)
);

create index courses_subject_idx on public.courses (university_id, subject_code);

create type public.requisite_kind as enum ('prerequisite', 'corequisite', 'exclusion');

create table public.course_requisites (
    course_id uuid not null references public.courses (id) on delete cascade,
    required_course_id uuid not null references public.courses (id) on delete cascade,
    kind public.requisite_kind not null,
    primary key (course_id, kind, required_course_id),
    check (course_id <> required_course_id)
);

-- For "leads to": courses that require a given course.
create index course_requisites_required_idx on public.course_requisites (required_course_id);

-- Timetable ------------------------------------------------------------------------------------

create type public.section_kind as enum (
    'lecture', 'lab', 'tutorial', 'seminar', 'studio', 'thesis', 'work_term', 'internship',
    'workshop', 'ensemble', 'clinical', 'field', 'independent_study', 'other'
);

-- One section of a course in a term: what a student registers in, identified by its CRN.
create table public.sections (
    id uuid primary key default gen_random_uuid(),
    university_id text not null,
    term_id uuid not null,
    course_id uuid not null,
    -- The university's id for the section (Banner's CRN).
    crn text not null check (length(crn) between 1 and 32),
    -- '01', 'B01', 'T02'.
    section text not null check (length(section) between 1 and 32),
    -- The university's own label ('Lec', 'Lab'), shown as is.
    type text not null check (length(type) between 1 and 32),
    -- The same thing in shared terms, so every university's sections can be treated alike.
    kind public.section_kind not null,
    credits numeric(6, 2) check (credits >= 0),
    capacity integer check (capacity >= 0),
    enrolled integer check (enrolled >= 0),
    waitlist integer check (waitlist >= 0),
    starts_on date,
    ends_on date check (ends_on >= starts_on),
    -- Banner's link connector ('L0, T0'): which lab or tutorial sections go with this one.
    link_code text,
    -- Courses this section is cross-listed with, by code.
    cross_listed_codes text[] not null default '{}',
    notes text,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    unique (term_id, crn),
    foreign key (term_id, university_id) references public.terms (id, university_id) on delete cascade,
    foreign key (course_id, university_id) references public.courses (id, university_id) on delete cascade
);

create index sections_course_idx on public.sections (course_id, term_id);

-- When and where a section meets. Most have one meeting; some add a different weekly time or a
-- one-off date with a different room.
create table public.section_meetings (
    section_id uuid not null references public.sections (id) on delete cascade,
    position smallint not null check (position >= 0),
    -- Monday to Sunday as M T W R F S U.
    days text[] not null default '{}' check (days <@ array['M', 'T', 'W', 'R', 'F', 'S', 'U']),
    -- Both null when there's no set time (online, by arrangement, thesis).
    start_time time,
    end_time time,
    -- As the university writes it: 'Studley GOLDBERG COMPUTER SCIENCE BLDG 127'.
    location text,
    starts_on date,
    ends_on date check (ends_on >= starts_on),
    primary key (section_id, position),
    check ((start_time is null) = (end_time is null)),
    check (end_time > start_time)
);

-- People as the timetable names them ('Poitras E.'). Two people with the same listed name can't be
-- told apart, since the timetable gives nothing else to go on.
create table public.instructors (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id) on delete cascade,
    name text not null check (length(name) between 1 and 200 and name = trim(name)),
    unique (university_id, name)
);

create table public.section_instructors (
    section_id uuid not null references public.sections (id) on delete cascade,
    instructor_id uuid not null references public.instructors (id) on delete cascade,
    -- The section's main instructor ('(P)' on Banner timetables).
    is_primary boolean not null default false,
    position smallint not null check (position >= 0),
    primary key (section_id, instructor_id)
);

create index section_instructors_instructor_idx on public.section_instructors (instructor_id);

-- Professor ratings from other sites. They're matched to instructors by name when read, through
-- match_name, so an instructor who first shows up after the ratings were fetched still matches.
create table public.instructor_ratings (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id) on delete cascade,
    source text not null check (source in ('rmp')),
    source_id text not null,
    -- The name as the university's timetable would write it ('Sarhan A.').
    match_name text not null,
    first_name text not null default '',
    last_name text not null default '',
    profile_url text,
    rating numeric(3, 2) check (rating between 0 and 5),
    difficulty numeric(3, 2) check (difficulty between 0 and 5),
    -- Percent, null when nobody answered.
    would_take_again numeric(5, 2) check (would_take_again between 0 and 100),
    rating_count integer not null default 0 check (rating_count >= 0),
    last_seen_at timestamptz not null default now(),
    unique (source, source_id)
);

create index instructor_ratings_match_idx on public.instructor_ratings (university_id, match_name);

-- Final exams, as the university posts them.
create table public.exams (
    id uuid primary key default gen_random_uuid(),
    university_id text not null,
    term_id uuid not null,
    course_id uuid not null,
    -- The section the exam is for, as the exam schedule writes it ('1' for Lec 01 at Dal).
    section text not null,
    starts_at timestamptz not null,
    ends_at timestamptz check (ends_at > starts_at),
    location text,
    unique (term_id, course_id, section),
    foreign key (term_id, university_id) references public.terms (id, university_id) on delete cascade,
    foreign key (course_id, university_id) references public.courses (id, university_id) on delete cascade
);

-- syllabi.py's record of every document it has looked at, syllabus or not, so a document isn't
-- downloaded and sent to the model twice. Only the scripts use it.
create table public.syllabus_documents (
    url text primary key,
    university_id text not null references public.universities (id) on delete cascade,
    status text not null,
    -- What syllabi.py recorded about the document: year, courses, extracted details, errors.
    data jsonb not null,
    updated_at timestamptz not null default now()
);

create trigger syllabus_documents_set_updated_at before update on public.syllabus_documents
    for each row execute function private.set_updated_at();

-- Existing tables become per-university ---------------------------------------------------------

alter table public.reviews
    add column university_id text not null default 'dal' references public.universities (id);
alter table public.reviews drop constraint reviews_course_code_check;
alter table public.reviews add constraint reviews_course_code_check check (course_code ~ '^[A-Z0-9]{2,20}$');
alter table public.reviews drop constraint reviews_user_id_course_code_key;
alter table public.reviews add constraint reviews_user_university_course_key unique (user_id, university_id, course_code);
-- Not validated: older reviews can be for courses that left the timetable before courses were
-- stored. Every new or edited review has to be for a real course.
alter table public.reviews add constraint reviews_course_fkey
    foreign key (university_id, course_code) references public.courses (university_id, code)
    on update cascade not valid;
drop index public.reviews_course_code_created_at_idx;
create index reviews_course_created_at_idx on public.reviews (university_id, course_code, created_at desc);

alter table public.external_reviews
    add column university_id text not null default 'dal' references public.universities (id);
alter table public.external_reviews drop constraint external_reviews_course_code_check;
alter table public.external_reviews
    add constraint external_reviews_course_code_check check (course_code ~ '^[A-Z0-9]{2,20}$');
alter table public.external_reviews add constraint external_reviews_course_fkey
    foreign key (university_id, course_code) references public.courses (university_id, code)
    on update cascade not valid;
drop index public.external_reviews_course_code_reviewed_at_idx;
create index external_reviews_course_reviewed_at_idx
    on public.external_reviews (university_id, course_code, reviewed_at desc);

alter table public.syllabi
    add column university_id text not null default 'dal' references public.universities (id);
alter table public.syllabi drop constraint syllabi_course_codes_check;
alter table public.syllabi add constraint syllabi_course_codes_check
    check (cardinality(course_codes) > 0 and course_codes::text ~ '^\{[A-Z0-9]{2,20}(,[A-Z0-9]{2,20})*\}$');

-- The university a student signed up through, from their email domain. Null for people let in
-- through allowed_emails.
alter table public.profiles
    add column university_id text references public.universities (id) on delete set null;

update public.profiles
set university_id = d.university_id
from public.university_email_domains d
where d.domain = substring(profiles.email from '@([^@]+)$');

grant insert (university_id) on public.reviews to authenticated;

-- Accounts: any listed university's domain instead of only @dal.ca -------------------------------

create function private.email_university(address text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select university_id from public.university_email_domains
    where domain = substring(lower(address) from '@([^@]+)$')
$$;

create or replace function private.can_have_account(address text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select private.email_university(address) is not null
        or exists (select 1 from public.allowed_emails where email = lower(address))
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not private.can_have_account(new.email) then
        raise exception 'Sign up with your university email address';
    end if;

    insert into public.profiles (id, email, role, university_id)
    values (
        new.id,
        lower(new.email),
        coalesce((select role from public.allowed_emails where email = lower(new.email)), 'user'),
        private.email_university(new.email)
    );
    return new;
end;
$$;

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not private.can_have_account(new.email) then
        raise exception 'Use your university email address';
    end if;

    update public.profiles
    set email = lower(new.email), university_id = private.email_university(new.email)
    where id = new.id;
    return new;
end;
$$;

-- Access: the catalog is public to read; only the scrapers (secret key) write it -----------------

alter table public.universities enable row level security;
alter table public.university_email_domains enable row level security;
alter table public.terms enable row level security;
alter table public.subjects enable row level security;
alter table public.courses enable row level security;
alter table public.course_requisites enable row level security;
alter table public.sections enable row level security;
alter table public.section_meetings enable row level security;
alter table public.instructors enable row level security;
alter table public.section_instructors enable row level security;
alter table public.instructor_ratings enable row level security;
alter table public.exams enable row level security;
alter table public.syllabus_documents enable row level security;

revoke all on
    public.universities, public.university_email_domains, public.terms, public.subjects,
    public.courses, public.course_requisites, public.sections, public.section_meetings,
    public.instructors, public.section_instructors, public.instructor_ratings, public.exams,
    public.syllabus_documents
from anon, authenticated;

grant select on
    public.universities, public.university_email_domains, public.terms, public.subjects,
    public.courses, public.course_requisites, public.sections, public.section_meetings,
    public.instructors, public.section_instructors, public.instructor_ratings, public.exams
to anon, authenticated;

create policy "Anyone reads universities" on public.universities for select to anon, authenticated using (true);
create policy "Anyone reads email domains" on public.university_email_domains for select to anon, authenticated using (true);
create policy "Anyone reads terms" on public.terms for select to anon, authenticated using (true);
create policy "Anyone reads subjects" on public.subjects for select to anon, authenticated using (true);
create policy "Anyone reads courses" on public.courses for select to anon, authenticated using (true);
create policy "Anyone reads requisites" on public.course_requisites for select to anon, authenticated using (true);
create policy "Anyone reads sections" on public.sections for select to anon, authenticated using (true);
create policy "Anyone reads meetings" on public.section_meetings for select to anon, authenticated using (true);
create policy "Anyone reads instructors" on public.instructors for select to anon, authenticated using (true);
create policy "Anyone reads section instructors" on public.section_instructors for select to anon, authenticated using (true);
create policy "Anyone reads instructor ratings" on public.instructor_ratings for select to anon, authenticated using (true);
create policy "Anyone reads exams" on public.exams for select to anon, authenticated using (true);

-- Read views. security_invoker so the tables' own policies apply. ------------------------------

-- Courses on the timetable right now: at least one section in a listed term.
create view public.catalog_courses with (security_invoker = on) as
select c.id, c.university_id, c.code, c.subject_code, c.number, c.title, c.credits, c.description
from public.courses c
where exists (
    select 1 from public.sections s
    join public.terms t on t.id = s.term_id
    where s.course_id = c.id and t.is_listed
);

-- Every section in a listed term, with its meetings and instructors.
create view public.catalog_sections with (security_invoker = on) as
select
    s.id,
    s.university_id,
    t.code as term,
    c.code as course,
    s.crn,
    s.section,
    s.type,
    s.kind,
    s.credits,
    s.capacity,
    s.enrolled,
    s.waitlist,
    s.starts_on,
    s.ends_on,
    coalesce((
        select jsonb_agg(jsonb_build_object(
            'days', m.days,
            'start_time', m.start_time,
            'end_time', m.end_time,
            'location', m.location,
            'starts_on', m.starts_on,
            'ends_on', m.ends_on
        ) order by m.position)
        from public.section_meetings m
        where m.section_id = s.id
    ), '[]'::jsonb) as meetings,
    coalesce((
        select jsonb_agg(jsonb_build_object('name', i.name, 'is_primary', si.is_primary) order by si.position)
        from public.section_instructors si
        join public.instructors i on i.id = si.instructor_id
        where si.section_id = s.id
    ), '[]'::jsonb) as instructors
from public.sections s
join public.terms t on t.id = s.term_id and t.is_listed
join public.courses c on c.id = s.course_id;

create view public.course_requisite_codes with (security_invoker = on) as
select c.university_id, c.code as course, r.code as required, cr.kind
from public.course_requisites cr
join public.courses c on c.id = cr.course_id
join public.courses r on r.id = cr.required_course_id;

-- One rating per timetable name: the profile with the most ratings when several share it.
create view public.instructor_rating_by_name with (security_invoker = on) as
select distinct on (university_id, match_name)
    university_id, match_name, first_name, last_name, profile_url, rating, difficulty,
    would_take_again, rating_count
from public.instructor_ratings
order by university_id, match_name, rating_count desc, source_id;

create view public.exam_schedule with (security_invoker = on) as
select e.university_id, t.code as term, c.code as course, e.section, e.starts_at, e.ends_at, e.location
from public.exams e
join public.terms t on t.id = e.term_id
join public.courses c on c.id = e.course_id;

grant select on
    public.catalog_courses, public.catalog_sections, public.course_requisite_codes,
    public.instructor_rating_by_name, public.exam_schedule
to anon, authenticated;

-- The scrapers use the secret key (service_role). Granted outright rather than relying on the
-- project's default privileges, which newer Supabase projects no longer give service_role.
grant select, insert, update, delete on
    public.universities, public.university_email_domains, public.terms, public.subjects,
    public.courses, public.course_requisites, public.sections, public.section_meetings,
    public.instructors, public.section_instructors, public.instructor_ratings, public.exams,
    public.syllabus_documents, public.external_reviews, public.syllabi
to service_role;

grant select on
    public.catalog_courses, public.catalog_sections, public.course_requisite_codes,
    public.instructor_rating_by_name, public.exam_schedule
to service_role;

-- Imports. Each call is one transaction, so a failed import changes nothing. ------------------------

-- Adds or updates terms: [{code, name, season, year, starts_on, ends_on}]. New terms aren't
-- listed until list_terms says so.
create function public.import_terms(p_university text, p_terms jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
    imported integer;
begin
    insert into public.terms (university_id, code, name, season, year, starts_on, ends_on)
    select p_university, t.code, t.name, t.season, t.year, t.starts_on, t.ends_on
    from jsonb_to_recordset(p_terms) as t(
        code text, name text, season public.term_season, year smallint, starts_on date, ends_on date
    )
    on conflict (university_id, code) do update set
        name = excluded.name,
        season = excluded.season,
        year = excluded.year,
        starts_on = excluded.starts_on,
        ends_on = excluded.ends_on;
    get diagnostics imported = row_count;
    return imported;
end;
$$;

-- Makes exactly these terms the ones on the timetable.
create function public.list_terms(p_university text, p_codes text[])
returns void
language plpgsql
set search_path = ''
as $$
declare
    missing text[];
begin
    select array_agg(wanted.code) into missing
    from unnest(p_codes) as wanted(code)
    where not exists (select 1 from public.terms t where t.university_id = p_university and t.code = wanted.code);
    if missing is not null then
        raise exception 'Unknown terms: %', array_to_string(missing, ', ');
    end if;

    update public.terms
    set is_listed = (code = any (p_codes))
    where university_id = p_university and is_listed is distinct from (code = any (p_codes));
end;
$$;

-- Saves part of a university's timetable. The payload:
--   scope:    [{term, subject}] - the term and subject pairs this payload holds in full. Sections
--             stored in them that aren't in the payload are deleted (cancelled or removed); nothing
--             outside them is touched, so a subject that failed to download keeps its old data.
--   subjects: [{code, name}]
--   courses:  [{code, subject_code, number, title, credits}] - every course the sections belong to
--   sections: [{term, crn, course, section, type, kind, credits, capacity, enrolled, waitlist,
--               starts_on, ends_on, link_code, cross_listed_codes, notes,
--               meetings: [{days, start_time, end_time, location, starts_on, ends_on}],
--               instructors: [{name, is_primary}]}]
-- Terms must exist already (import_terms). Returns counts.
create function public.import_timetable(p_university text, p_payload jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
    problem text;
    section_count integer;
    deleted_count integer;
begin
    insert into public.subjects (university_id, code, name)
    select p_university, s.code, s.name
    from jsonb_to_recordset(coalesce(p_payload -> 'subjects', '[]')) as s(code text, name text)
    on conflict (university_id, code) do update set name = excluded.name;

    insert into public.courses (university_id, code, subject_code, number, title, credits)
    select p_university, c.code, c.subject_code, c.number, c.title, c.credits
    from jsonb_to_recordset(coalesce(p_payload -> 'courses', '[]')) as c(
        code text, subject_code text, number text, title text, credits numeric
    )
    on conflict (university_id, code) do update set
        subject_code = excluded.subject_code,
        number = excluded.number,
        title = excluded.title,
        credits = excluded.credits,
        last_seen_at = now();

    create temporary table import_scope on commit drop as
    select t.id as term_id, s.term, s.subject
    from jsonb_to_recordset(coalesce(p_payload -> 'scope', '[]')) as s(term text, subject text)
    left join public.terms t on t.university_id = p_university and t.code = s.term;

    select string_agg(distinct term, ', ') into problem from pg_temp.import_scope where term_id is null;
    if problem is not null then
        raise exception 'Unknown terms in scope: %', problem;
    end if;

    create temporary table import_sections on commit drop as
    select t.id as term_id, c.id as course_id, c.subject_code, x.*
    from jsonb_to_recordset(coalesce(p_payload -> 'sections', '[]')) as x(
        term text, crn text, course text, section text, type text, kind public.section_kind,
        credits numeric, capacity integer, enrolled integer, waitlist integer, starts_on date,
        ends_on date, link_code text, cross_listed_codes text[], notes text, meetings jsonb,
        instructors jsonb
    )
    left join public.terms t on t.university_id = p_university and t.code = x.term
    left join public.courses c on c.university_id = p_university and c.code = x.course;

    select string_agg(distinct term || ' ' || coalesce(crn, '?') || ' ' || coalesce(course, '?'), ', ') into problem
    from pg_temp.import_sections where term_id is null or course_id is null;
    if problem is not null then
        raise exception 'Sections with an unknown term or course: %', problem;
    end if;

    select string_agg(term || ' ' || crn, ', ') into problem
    from (select term, crn from pg_temp.import_sections group by term, crn having count(*) > 1) duplicates;
    if problem is not null then
        raise exception 'Duplicate sections: %', problem;
    end if;

    select string_agg(distinct x.term || ' ' || x.subject_code, ', ') into problem
    from pg_temp.import_sections x
    where not exists (
        select 1 from pg_temp.import_scope s where s.term_id = x.term_id and s.subject = x.subject_code
    );
    if problem is not null then
        raise exception 'Sections outside the scope: %', problem;
    end if;

    insert into public.sections (
        university_id, term_id, course_id, crn, section, type, kind, credits, capacity, enrolled,
        waitlist, starts_on, ends_on, link_code, cross_listed_codes, notes
    )
    select
        p_university, term_id, course_id, crn, section, type, kind, credits, capacity, enrolled,
        waitlist, starts_on, ends_on, link_code, coalesce(cross_listed_codes, '{}'), notes
    from pg_temp.import_sections
    on conflict (term_id, crn) do update set
        course_id = excluded.course_id,
        section = excluded.section,
        type = excluded.type,
        kind = excluded.kind,
        credits = excluded.credits,
        capacity = excluded.capacity,
        enrolled = excluded.enrolled,
        waitlist = excluded.waitlist,
        starts_on = excluded.starts_on,
        ends_on = excluded.ends_on,
        link_code = excluded.link_code,
        cross_listed_codes = excluded.cross_listed_codes,
        notes = excluded.notes,
        last_seen_at = now();
    get diagnostics section_count = row_count;

    create temporary table import_section_ids on commit drop as
    select s.id, x.meetings, x.instructors
    from pg_temp.import_sections x
    join public.sections s on s.term_id = x.term_id and s.crn = x.crn;

    delete from public.section_meetings where section_id in (select id from pg_temp.import_section_ids);
    insert into public.section_meetings (section_id, position, days, start_time, end_time, location, starts_on, ends_on)
    select
        x.id,
        (m.position - 1)::smallint,
        array(select jsonb_array_elements_text(coalesce(m.meeting -> 'days', '[]'))),
        (m.meeting ->> 'start_time')::time,
        (m.meeting ->> 'end_time')::time,
        m.meeting ->> 'location',
        (m.meeting ->> 'starts_on')::date,
        (m.meeting ->> 'ends_on')::date
    from pg_temp.import_section_ids x
    cross join lateral jsonb_array_elements(coalesce(x.meetings, '[]')) with ordinality as m(meeting, position);

    insert into public.instructors (university_id, name)
    select distinct p_university, i.person ->> 'name'
    from pg_temp.import_section_ids x
    cross join lateral jsonb_array_elements(coalesce(x.instructors, '[]')) as i(person)
    on conflict (university_id, name) do nothing;

    delete from public.section_instructors where section_id in (select id from pg_temp.import_section_ids);
    insert into public.section_instructors (section_id, instructor_id, is_primary, position)
    select distinct on (x.id, people.id)
        x.id, people.id, coalesce((i.person ->> 'is_primary')::boolean, false), (i.position - 1)::smallint
    from pg_temp.import_section_ids x
    cross join lateral jsonb_array_elements(coalesce(x.instructors, '[]')) with ordinality as i(person, position)
    join public.instructors people on people.university_id = p_university and people.name = i.person ->> 'name'
    order by x.id, people.id, i.position;

    delete from public.sections s
    using pg_temp.import_scope scope, public.courses c
    where s.term_id = scope.term_id
        and c.id = s.course_id
        and c.subject_code = scope.subject
        and not exists (select 1 from pg_temp.import_sections x where x.term_id = s.term_id and x.crn = s.crn);
    get diagnostics deleted_count = row_count;

    return jsonb_build_object('sections', section_count, 'deleted', deleted_count);
end;
$$;

-- Saves what a university's calendar says about courses:
--   [{code, description, requisites_text, requisites: [{code, kind}]}]
-- Each course's requisites are replaced. Requisites naming a course that isn't stored are dropped.
create function public.import_course_details(p_university text, p_courses jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
    updated integer;
begin
    create temporary table import_details on commit drop as
    select c.id, x.description, x.requisites_text, x.requisites
    from jsonb_to_recordset(p_courses) as x(code text, description text, requisites_text text, requisites jsonb)
    join public.courses c on c.university_id = p_university and c.code = x.code;

    update public.courses c
    set description = d.description, requisites_text = d.requisites_text, details_updated_at = now()
    from pg_temp.import_details d
    where c.id = d.id;
    get diagnostics updated = row_count;

    delete from public.course_requisites where course_id in (select id from pg_temp.import_details);
    insert into public.course_requisites (course_id, required_course_id, kind)
    select d.id, required.id, r.kind
    from pg_temp.import_details d
    cross join lateral jsonb_to_recordset(coalesce(d.requisites, '[]')) as r(code text, kind public.requisite_kind)
    join public.courses required on required.university_id = p_university and required.code = r.code
    where required.id <> d.id
    on conflict do nothing;

    return updated;
end;
$$;

-- Replaces a term's exams: [{course, section, starts_at, ends_at, location}]. Exams for courses
-- that aren't stored are skipped. Returns how many were saved.
create function public.import_exams(p_university text, p_term text, p_exams jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
declare
    exam_term uuid;
    saved integer;
begin
    select id into exam_term from public.terms where university_id = p_university and code = p_term;
    if exam_term is null then
        raise exception 'Unknown term: %', p_term;
    end if;

    delete from public.exams where term_id = exam_term;
    insert into public.exams (university_id, term_id, course_id, section, starts_at, ends_at, location)
    select distinct on (c.id, x.section) p_university, exam_term, c.id, x.section, x.starts_at, x.ends_at, x.location
    from jsonb_to_recordset(p_exams) as x(course text, section text, starts_at timestamptz, ends_at timestamptz, location text)
    join public.courses c on c.university_id = p_university and c.code = x.course
    order by c.id, x.section, x.starts_at;
    get diagnostics saved = row_count;
    return saved;
end;
$$;

revoke all on function
    public.import_terms(text, jsonb),
    public.list_terms(text, text[]),
    public.import_timetable(text, jsonb),
    public.import_course_details(text, jsonb),
    public.import_exams(text, text, jsonb)
from public, anon, authenticated;

grant execute on function
    public.import_terms(text, jsonb),
    public.list_terms(text, text[]),
    public.import_timetable(text, jsonb),
    public.import_course_details(text, jsonb),
    public.import_exams(text, text, jsonb)
to service_role;
