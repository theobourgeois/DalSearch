-- Reviews come only from a university's own students: you can review its courses if your sign-up email
-- is one of its addresses, or if you've since confirmed one of its addresses (students cross-registered
-- at another school). Accounts added by hand in allowed_emails can review anywhere.

-- The universities each student has shown they attend, with the address that proved it.
create table public.student_universities (
    user_id uuid not null references public.profiles (id) on delete cascade,
    university_id text not null references public.universities (id),
    email text not null check (email = lower(email)),
    verified_at timestamptz not null default now(),
    primary key (user_id, university_id)
);

alter table public.student_universities enable row level security;

create policy "Students read their own universities"
    on public.student_universities for select to authenticated
    using (user_id = (select auth.uid()));

revoke all on public.student_universities from anon, authenticated;
grant select on public.student_universities to authenticated;
grant all on public.student_universities to service_role;

-- Codes emailed to a second university address. Only the server (service role) reads or writes them;
-- the code itself is stored hashed.
create table public.university_email_codes (
    user_id uuid not null references public.profiles (id) on delete cascade,
    email text not null check (email = lower(email)),
    university_id text not null references public.universities (id),
    code_hash text not null,
    attempts int not null default 0,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    primary key (user_id, email)
);

alter table public.university_email_codes enable row level security;
revoke all on public.university_email_codes from anon, authenticated;
grant all on public.university_email_codes to service_role;

-- Everyone who already has an account attends the university their email belongs to.
insert into public.student_universities (user_id, university_id, email, verified_at)
select id, university_id, email, created_at
from public.profiles
where university_id is not null
on conflict do nothing;

-- And so does everyone who signs up from now on.
create function private.add_home_university()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.university_id is not null then
        insert into public.student_universities (user_id, university_id, email)
        values (new.id, new.university_id, new.email)
        on conflict do nothing;
    end if;
    return new;
end;
$$;

create trigger add_home_university
    after insert on public.profiles
    for each row execute function private.add_home_university();

-- Whether the signed-in user may review a university's courses.
create function public.can_review(p_university text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.student_universities
        where user_id = auth.uid() and university_id = p_university
    ) or exists (
        select 1 from public.allowed_emails a
        join public.profiles p on p.email = a.email
        where p.id = auth.uid()
    )
$$;

revoke all on function public.can_review(text) from public, anon;
grant execute on function public.can_review(text) to authenticated;

drop policy "Students post reviews as themselves" on public.reviews;
create policy "Students review their own university's courses"
    on public.reviews for insert to authenticated
    with check (user_id = (select auth.uid()) and (select public.can_review(university_id)));
