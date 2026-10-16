-- Moderation for RateMyProfessors reviews: students report them, moderators hide them.
-- Hiding is a column rather than a delete so the next import doesn't bring the review back;
-- rmp_reviews.py never writes hidden_at.

alter table public.external_reviews add column hidden_at timestamptz;

create table public.external_review_flags (
    id uuid primary key default gen_random_uuid(),
    external_review_id uuid not null references public.external_reviews (id) on delete cascade,
    user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (external_review_id, user_id)
);

create index external_review_flags_user_id_idx on public.external_review_flags (user_id);

alter table public.external_review_flags enable row level security;

revoke all on public.external_review_flags from anon, authenticated;
grant select, insert (external_review_id), delete on public.external_review_flags to authenticated;
grant update (hidden_at) on public.external_reviews to authenticated;

-- Hidden reviews disappear for everyone except moderators. my_role() isn't available to anon,
-- so signed-out visitors get their own policy.

drop policy "Anyone reads external reviews" on public.external_reviews;

create policy "Visitors read visible external reviews"
    on public.external_reviews for select to anon
    using (hidden_at is null);

create policy "Students read visible external reviews, moderators read all"
    on public.external_reviews for select to authenticated
    using (hidden_at is null or (select public.my_role()) >= 'admin');

create policy "Moderators hide external reviews"
    on public.external_reviews for update to authenticated
    using ((select public.my_role()) >= 'admin')
    with check ((select public.my_role()) >= 'admin');

create policy "Moderators read external review flags"
    on public.external_review_flags for select to authenticated
    using ((select public.my_role()) >= 'admin');

create policy "Students report external reviews"
    on public.external_review_flags for insert to authenticated
    with check (user_id = (select auth.uid()));

create policy "Moderators clear external review flags"
    on public.external_review_flags for delete to authenticated
    using ((select public.my_role()) >= 'admin');
