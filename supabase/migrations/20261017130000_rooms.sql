-- Rooms as their own records. A class meeting can be in several rooms at once ("1210, 2107"), and
-- some meetings have no room at all (online, to be announced), so meetings link to rooms through
-- meeting_rooms. Each university's scraper splits its timetable's location text into rooms; the
-- meeting keeps that text, made readable, as `location`.
--
-- Rooms fill in on the next timetable import (node src/scripts/node/refresh.js <university>).

create table public.rooms (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id) on delete cascade,
    -- Null when the timetable doesn't say.
    campus text check (length(campus) between 1 and 100),
    -- Readable: 'Goldberg Computer Science Bldg'.
    building text not null check (length(building) between 1 and 200),
    -- As the timetable writes it: '127', 'B308', 'SEM'. Null when only a building is given.
    room text check (length(room) between 1 and 50),
    -- 'Goldberg Computer Science Bldg 127'
    name text generated always as (building || coalesce(' ' || room, '')) stored,
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    unique nulls not distinct (university_id, campus, building, room)
);

create index rooms_university_idx on public.rooms (university_id, name);

create table public.meeting_rooms (
    section_id uuid not null,
    position smallint not null,
    room_id uuid not null references public.rooms (id) on delete cascade,
    primary key (section_id, position, room_id),
    foreign key (section_id, position) references public.section_meetings (section_id, position) on delete cascade
);

-- For a room's schedule.
create index meeting_rooms_room_idx on public.meeting_rooms (room_id);

alter table public.rooms enable row level security;
alter table public.meeting_rooms enable row level security;

revoke all on public.rooms, public.meeting_rooms from anon, authenticated;
grant select on public.rooms, public.meeting_rooms to anon, authenticated;
grant select, insert, update, delete on public.rooms, public.meeting_rooms to service_role;

create policy "Anyone reads rooms" on public.rooms for select to anon, authenticated using (true);
create policy "Anyone reads meeting rooms" on public.meeting_rooms for select to anon, authenticated using (true);

-- Meetings now list their room ids.
-- Every section in a listed term, with its meetings and instructors.
create or replace view public.catalog_sections with (security_invoker = on) as
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
            'ends_on', m.ends_on,
            'rooms', coalesce((
                select jsonb_agg(mr.room_id order by mr.room_id)
                from public.meeting_rooms mr
                where mr.section_id = m.section_id and mr.position = m.position
            ), '[]'::jsonb)
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

-- Saves part of a university's timetable. The payload:
--   scope:    [{term, subject}] - the term and subject pairs this payload holds in full. Sections
--             stored in them that aren't in the payload are deleted (cancelled or removed); nothing
--             outside them is touched, so a subject that failed to download keeps its old data.
--   subjects: [{code, name}]
--   courses:  [{code, subject_code, number, title, credits}] - every course the sections belong to
--   sections: [{term, crn, course, section, type, kind, credits, capacity, enrolled, waitlist,
--               starts_on, ends_on, link_code, cross_listed_codes, notes,
--               meetings: [{days, start_time, end_time, location, starts_on, ends_on,
--                           rooms: [{campus, building, room}]}],
--               instructors: [{name, is_primary}]}]
-- Terms must exist already (import_terms). Returns counts.
create or replace function public.import_timetable(p_university text, p_payload jsonb)
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

    -- The rooms each meeting is in. Rooms are kept once seen, like courses.
    create temporary table import_meeting_rooms on commit drop as
    select distinct
        x.id as section_id,
        (m.position - 1)::smallint as position,
        nullif(trim(r.room ->> 'campus'), '') as campus,
        trim(r.room ->> 'building') as building,
        nullif(trim(r.room ->> 'room'), '') as room
    from pg_temp.import_section_ids x
    cross join lateral jsonb_array_elements(coalesce(x.meetings, '[]')) with ordinality as m(meeting, position)
    cross join lateral jsonb_array_elements(coalesce(m.meeting -> 'rooms', '[]')) as r(room);

    insert into public.rooms (university_id, campus, building, room)
    select distinct p_university, campus, building, room from pg_temp.import_meeting_rooms
    on conflict (university_id, campus, building, room) do update set last_seen_at = now();

    -- The meetings were just recreated, so their old room links went with them.
    insert into public.meeting_rooms (section_id, position, room_id)
    select distinct x.section_id, x.position, r.id
    from pg_temp.import_meeting_rooms x
    join public.rooms r
        on r.university_id = p_university
        and r.campus is not distinct from x.campus
        and r.building = x.building
        and r.room is not distinct from x.room;

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
