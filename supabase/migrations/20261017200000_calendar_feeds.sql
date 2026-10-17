-- A private address per student that calendar apps (Google, Apple, Outlook) subscribe to, serving the
-- schedules saved to their account as an iCalendar feed. Calendar apps can't sign in, so the token in
-- the address is the only credential: /api/calendar/<token>.ics reads it with the secret key.
-- Students get their token, and reset it by deleting the row and adding a new one. They can't choose it.
create table public.calendar_feeds (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    token text not null unique
        default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    created_at timestamptz not null default now()
);

alter table public.calendar_feeds enable row level security;

create policy "Students read their own calendar feed"
    on public.calendar_feeds for select to authenticated
    using (user_id = (select auth.uid()));

create policy "Students create their own calendar feed"
    on public.calendar_feeds for insert to authenticated
    with check (user_id = (select auth.uid()));

create policy "Students delete their own calendar feed"
    on public.calendar_feeds for delete to authenticated
    using (user_id = (select auth.uid()));

revoke all on public.calendar_feeds from anon, authenticated;
grant select, delete on public.calendar_feeds to authenticated;
grant insert (user_id) on public.calendar_feeds to authenticated;
grant all on public.calendar_feeds to service_role;
