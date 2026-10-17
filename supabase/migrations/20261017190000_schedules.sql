-- Signed-in students' schedules, one row per university and term, so a schedule follows the account
-- between devices. Signed-out visitors keep theirs in the browser only. `sessions` is the site's
-- ClassSession[] for that term: the sections picked, with their times and rooms when saved.
create table public.schedules (
    user_id uuid not null references public.profiles (id) on delete cascade,
    university_id text not null references public.universities (id),
    term text not null,
    sessions jsonb not null default '[]'::jsonb check (jsonb_typeof(sessions) = 'array'),
    updated_at timestamptz not null default now(),
    primary key (user_id, university_id, term)
);

alter table public.schedules enable row level security;

create policy "Students read their own schedules"
    on public.schedules for select to authenticated
    using (user_id = (select auth.uid()));

create policy "Students save their own schedules"
    on public.schedules for insert to authenticated
    with check (user_id = (select auth.uid()));

create policy "Students change their own schedules"
    on public.schedules for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy "Students delete their own schedules"
    on public.schedules for delete to authenticated
    using (user_id = (select auth.uid()));

revoke all on public.schedules from anon, authenticated;
grant select, insert, update, delete on public.schedules to authenticated;
grant all on public.schedules to service_role;
