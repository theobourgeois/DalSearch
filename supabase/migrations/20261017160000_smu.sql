-- Saint Mary's University. Its timetable comes from Banner 9 Self-Service and its course details
-- from CourseLeaf (src/scripts/node/universities/smu.js).

insert into public.universities (id, name, short_name, timezone, website_url, rmp_school_id, credit_label)
values ('smu', 'Saint Mary''s University', 'SMU', 'America/Halifax', 'https://www.smu.ca', 'School-1475', 'credit hours');

insert into public.university_email_domains (domain, university_id) values ('smu.ca', 'smu');
