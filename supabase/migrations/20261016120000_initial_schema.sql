-- DalSearch: accounts, roles, course reviews and moderation flags.
--
-- Access is decided here, not in the app. The publishable key ships to every browser, so
-- each table starts with no privileges and gets back only what the app needs, and row level
-- security limits those privileges to the right rows.

-- Roles, lowest to highest. Policies compare them with >=, so keep this order.
create type public.user_role as enum ('user', 'admin', 'owner');

-- Addresses that may have an account without a @dal.ca email, and the role they start with.
-- Only editable from the dashboard or SQL editor.
create table public.allowed_emails (
    email text primary key check (email = lower(email)),
    role public.user_role not null default 'user',
    note text,
    created_at timestamptz not null default now()
);

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text not null unique check (email = lower(email)),
    role public.user_role not null default 'user',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.reviews (
    id uuid primary key default gen_random_uuid(),
    course_code text not null check (course_code ~ '^[A-Z]{4}[0-9]{4}$'),
    user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    instructor text not null check (length(trim(instructor)) between 1 and 200),
    review_text text not null check (length(trim(review_text)) between 1 and 4000),
    rating smallint not null check (rating between 1 and 5),
    difficulty smallint not null check (difficulty between 1 and 5),
    workload smallint not null check (workload between 1 and 5),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, course_code)
);

create index reviews_course_code_created_at_idx on public.reviews (course_code, created_at desc);

create table public.flags (
    id uuid primary key default gen_random_uuid(),
    review_id uuid not null references public.reviews (id) on delete cascade,
    user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (review_id, user_id)
);

create index flags_user_id_idx on public.flags (user_id);

-- Helpers. Trigger functions live in a schema the API doesn't expose.

create schema private;

-- The signed-in user's role, or null when signed out. Security definer so policies can read
-- profiles without running into the profiles policies themselves.
create function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
    select role from public.profiles where id = auth.uid()
$$;

create function private.can_have_account(address text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select lower(address) like '%@dal.ca'
        or exists (select 1 from public.allowed_emails where email = lower(address))
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
    for each row execute function private.set_updated_at();

create trigger reviews_set_updated_at before update on public.reviews
    for each row execute function private.set_updated_at();

-- Every account gets a profile. Anyone without a @dal.ca address or an allowed_emails entry
-- is turned away, whether they sign up through the site or the API.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not private.can_have_account(new.email) then
        raise exception 'Sign up with your @dal.ca email address';
    end if;

    insert into public.profiles (id, email, role)
    values (
        new.id,
        lower(new.email),
        coalesce((select role from public.allowed_emails where email = lower(new.email)), 'user')
    );
    return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
    for each row execute function private.handle_new_user();

create function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if not private.can_have_account(new.email) then
        raise exception 'Use your @dal.ca email address';
    end if;

    update public.profiles set email = lower(new.email) where id = new.id;
    return new;
end;
$$;

create trigger on_auth_user_email_changed after update of email on auth.users
    for each row when (old.email is distinct from new.email)
    execute function private.handle_user_email_change();

-- Privileges: start from nothing, then grant what the app uses. Column lists keep people from
-- writing fields like user_id, course_code or role themselves.

alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.flags enable row level security;

revoke all on public.allowed_emails, public.profiles, public.reviews, public.flags from anon, authenticated;
revoke all on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

grant select on public.reviews to anon, authenticated;
grant insert (course_code, instructor, review_text, rating, difficulty, workload) on public.reviews to authenticated;
grant update (instructor, review_text, rating, difficulty, workload) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

grant select, update (role) on public.profiles to authenticated;

grant select, insert (review_id), delete on public.flags to authenticated;

-- Profiles: emails stay private. Owners see everyone so they can manage admins.

create policy "Users read their own profile, owners read all"
    on public.profiles for select to authenticated
    using (id = (select auth.uid()) or (select public.my_role()) = 'owner');

create policy "Owners make people admins or users"
    on public.profiles for update to authenticated
    using ((select public.my_role()) = 'owner' and role <> 'owner')
    with check (role <> 'owner');

-- Reviews: public to read, written only by their author, removable by moderators.

create policy "Anyone reads reviews"
    on public.reviews for select to anon, authenticated
    using (true);

create policy "Students post reviews as themselves"
    on public.reviews for insert to authenticated
    with check (user_id = (select auth.uid()));

create policy "Students edit their own reviews"
    on public.reviews for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy "Authors and moderators delete reviews"
    on public.reviews for delete to authenticated
    using (user_id = (select auth.uid()) or (select public.my_role()) >= 'admin');

-- Flags: anyone signed in can flag someone else's review; only moderators see or clear them.

create policy "Moderators read flags"
    on public.flags for select to authenticated
    using ((select public.my_role()) >= 'admin');

create policy "Students flag other people's reviews"
    on public.flags for insert to authenticated
    with check (
        user_id = (select auth.uid())
        and not exists (
            select 1 from public.reviews
            where reviews.id = review_id and reviews.user_id = (select auth.uid())
        )
    );

create policy "Moderators clear flags"
    on public.flags for delete to authenticated
    using ((select public.my_role()) >= 'admin');
