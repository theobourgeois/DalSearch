-- Public bucket for images in auth emails (the logo). Email clients can't show inline SVG or
-- data URIs, so images need a public URL. Files are uploaded from the dashboard.
insert into storage.buckets (id, name, public)
values ('email', 'email', true);
