-- Mount Saint Vincent University. Its timetable comes from Colleague Self-Service
-- (src/scripts/node/universities/msvu.js). MSVU counts credit in units: 0.5 is a one-term course.

insert into public.universities (id, name, short_name, timezone, website_url, rmp_school_id, credit_label)
values ('msvu', 'Mount Saint Vincent University', 'MSVU', 'America/Halifax', 'https://www.msvu.ca', 'School-1445', 'units');

insert into public.university_email_domains (domain, university_id) values ('msvu.ca', 'msvu');
