-- One row per run of src/scripts/node/refresh.js: whether it worked, what the health checks found,
-- and what it scraped. The daily workflow reads these to open an issue (and send an agent) when a
-- university fails twice in a row, and to close it once it's healthy again. A run that saved
-- data is the baseline the next run's numbers are compared with.
create table public.refresh_runs (
    id bigint generated always as identity primary key,
    university_id text not null references public.universities (id) on delete cascade,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    -- running: hasn't finished (still going, or the job died). ok: saved, nothing wrong.
    -- warning: saved, but something needs a look. failed: nothing saved.
    status text not null default 'running' check (status in ('running', 'ok', 'warning', 'failed')),
    -- What the health checks found, as sentences.
    problems text[] not null default '{}',
    error text,
    -- What the scrape found: see measure() in src/scripts/node/lib/health.js.
    metrics jsonb
);

create index refresh_runs_university_started on public.refresh_runs (university_id, started_at desc);

alter table public.refresh_runs enable row level security;

-- Counts and error messages about public timetables, nothing private. Readable so a dry run can
-- compare against the baseline without the secret key.
create policy "Anyone reads refresh runs" on public.refresh_runs for select to anon, authenticated using (true);

revoke all on public.refresh_runs from anon, authenticated;
grant select on public.refresh_runs to anon, authenticated;
grant all on public.refresh_runs to service_role;
