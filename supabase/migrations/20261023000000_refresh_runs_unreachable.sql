-- unreachable: the university's server didn't answer, so nothing was scraped or saved. Kept apart
-- from failed because it says nothing about the scraper: triage.js only reports it when it lasts.
alter table public.refresh_runs drop constraint refresh_runs_status_check;
alter table public.refresh_runs add constraint refresh_runs_status_check
    check (status in ('running', 'ok', 'warning', 'failed', 'unreachable'));
