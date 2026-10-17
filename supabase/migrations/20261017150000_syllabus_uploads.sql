-- Syllabi students upload. Many universities (MSVU among them) only hand out syllabi inside their
-- learning system, so students who have one can share it. The PDF stays private: the site reads it
-- with a model as soon as it's uploaded (src/app/api/syllabi/upload), a moderator checks what was read,
-- and only the extracted facts are published, as a row in syllabi.

-- Private storage for the PDFs, one folder per student.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('syllabus-uploads', 'syllabus-uploads', false, 10485760, array['application/pdf']);

create policy "Students upload syllabi into their own folder"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'syllabus-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Students read their own uploads, moderators read all"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'syllabus-uploads'
        and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.my_role()) >= 'admin')
    );

create type public.upload_status as enum ('pending', 'approved', 'rejected');

create table public.syllabus_uploads (
    id uuid primary key default gen_random_uuid(),
    university_id text not null references public.universities (id),
    course_code text not null,
    user_id uuid not null references public.profiles (id) on delete cascade,
    -- The PDF in the syllabus-uploads bucket: "<user id>/<upload id>.pdf".
    file_path text not null unique,
    file_name text not null check (length(file_name) between 1 and 300),
    status public.upload_status not null default 'pending',
    -- What the model read, in the same shape as syllabi's columns (see src/lib/syllabus-extraction.json).
    details jsonb not null,
    -- Why a moderator turned it down, for the record.
    rejection_reason text,
    reviewed_by uuid references public.profiles (id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    foreign key (university_id, course_code) references public.courses (university_id, code)
);

create index syllabus_uploads_status_idx on public.syllabus_uploads (status, created_at);
create index syllabus_uploads_user_idx on public.syllabus_uploads (user_id, created_at desc);

-- Only the server writes uploads (it checks the file with the model first); students see their own,
-- moderators see everything.
alter table public.syllabus_uploads enable row level security;
revoke all on public.syllabus_uploads from anon, authenticated;
grant select on public.syllabus_uploads to authenticated;
grant select, insert, update, delete on public.syllabus_uploads to service_role;

create policy "Students read their own uploads, moderators read all"
    on public.syllabus_uploads for select to authenticated
    using (user_id = (select auth.uid()) or (select public.my_role()) >= 'admin');

-- A published syllabus comes from a public URL or from an approved upload, which has no public file.
alter table public.syllabi alter column source_url drop not null;
alter table public.syllabi
    add column upload_id uuid unique references public.syllabus_uploads (id) on delete cascade;
alter table public.syllabi
    add constraint syllabi_source_check check (source_url is not null or upload_id is not null);
