-- Ten more universities whose class searches answer without signing in (see their scrapers in
-- src/scripts/node/universities/): Banner 9 at MUN, UVic, USask, KPU, TRU, UNBC, Yukon and StFX, and
-- Colleague Self-Service at UPEI and Laurentian.

insert into public.universities (id, name, short_name, timezone, website_url, rmp_school_id, credit_label) values
    ('mun', 'Memorial University of Newfoundland', 'MUN', 'America/St_Johns', 'https://www.mun.ca', 'School-1441', 'credit hours'),
    ('uvic', 'University of Victoria', 'UVic', 'America/Vancouver', 'https://www.uvic.ca', 'School-1488', 'units'),
    ('usask', 'University of Saskatchewan', 'USask', 'America/Regina', 'https://www.usask.ca', 'School-1480', 'credit units'),
    ('kpu', 'Kwantlen Polytechnic University', 'KPU', 'America/Vancouver', 'https://www.kpu.ca', 'School-4028', 'credits'),
    ('tru', 'Thompson Rivers University', 'TRU', 'America/Vancouver', 'https://www.tru.ca', 'School-1419', 'credits'),
    ('unbc', 'University of Northern British Columbia', 'UNBC', 'America/Vancouver', 'https://www.unbc.ca', 'School-1448', 'credit hours'),
    ('yukonu', 'Yukon University', 'YukonU', 'America/Whitehorse', 'https://www.yukonu.ca', 'School-4519', 'credits'),
    ('stfx', 'St. Francis Xavier University', 'StFX', 'America/Halifax', 'https://www.stfx.ca', 'School-1473', 'credits'),
    ('upei', 'University of Prince Edward Island', 'UPEI', 'America/Halifax', 'https://www.upei.ca', 'School-1454', 'credits'),
    ('laurentian', 'Laurentian University', 'Laurentian', 'America/Toronto', 'https://laurentian.ca', 'School-1433', 'credits')
on conflict (id) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    timezone = excluded.timezone,
    website_url = excluded.website_url,
    rmp_school_id = excluded.rmp_school_id,
    credit_label = excluded.credit_label;

-- Students' email domains. KPU and TRU give students their own domain.
insert into public.university_email_domains (domain, university_id) values
    ('mun.ca', 'mun'),
    ('uvic.ca', 'uvic'),
    ('usask.ca', 'usask'),
    ('student.kpu.ca', 'kpu'),
    ('kpu.ca', 'kpu'),
    ('mytru.ca', 'tru'),
    ('tru.ca', 'tru'),
    ('unbc.ca', 'unbc'),
    ('yukonu.ca', 'yukonu'),
    ('stfx.ca', 'stfx'),
    ('upei.ca', 'upei'),
    ('laurentian.ca', 'laurentian')
on conflict (domain) do nothing;
