-- Ten more schools whose class searches answer without signing in (see their scrapers in
-- src/scripts/node/universities/): Banner 9 at Laurier, Mount Royal, Regina, UFV, Douglas, Capilano,
-- Lethbridge and Moncton, and Colleague Self-Service at Guelph and CBU.

insert into public.universities (id, name, short_name, timezone, website_url, rmp_school_id, credit_label) values
    ('guelph', 'University of Guelph', 'Guelph', 'America/Toronto', 'https://www.uoguelph.ca', 'School-1426', 'credits'),
    ('wlu', 'Wilfrid Laurier University', 'Laurier', 'America/Toronto', 'https://www.wlu.ca', 'School-1492', 'credits'),
    ('douglas', 'Douglas College', 'Douglas', 'America/Vancouver', 'https://www.douglascollege.ca', 'School-13705', 'credits'),
    ('mru', 'Mount Royal University', 'MRU', 'America/Edmonton', 'https://www.mtroyal.ca', 'School-1570', 'credits'),
    ('uregina', 'University of Regina', 'U of R', 'America/Regina', 'https://www.uregina.ca', 'School-1468', 'credit hours'),
    ('ufv', 'University of the Fraser Valley', 'UFV', 'America/Vancouver', 'https://www.ufv.ca', 'School-1425', 'credits'),
    ('uleth', 'University of Lethbridge', 'uLethbridge', 'America/Edmonton', 'https://www.ulethbridge.ca', 'School-1435', 'credit hours'),
    ('capilano', 'Capilano University', 'CapU', 'America/Vancouver', 'https://www.capilanou.ca', 'School-4003', 'credits'),
    ('cbu', 'Cape Breton University', 'CBU', 'America/Halifax', 'https://www.cbu.ca', 'School-1418', 'credits'),
    ('umoncton', 'Université de Moncton', 'UMoncton', 'America/Moncton', 'https://www.umoncton.ca', 'School-1442', 'credits')
on conflict (id) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    timezone = excluded.timezone,
    website_url = excluded.website_url,
    rmp_school_id = excluded.rmp_school_id,
    credit_label = excluded.credit_label;

-- Students' email domains. Laurier, UFV, Douglas and Capilano give students their own domain.
insert into public.university_email_domains (domain, university_id) values
    ('uoguelph.ca', 'guelph'),
    ('mylaurier.ca', 'wlu'),
    ('wlu.ca', 'wlu'),
    ('student.douglascollege.ca', 'douglas'),
    ('douglascollege.ca', 'douglas'),
    ('mtroyal.ca', 'mru'),
    ('uregina.ca', 'uregina'),
    ('student.ufv.ca', 'ufv'),
    ('ufv.ca', 'ufv'),
    ('uleth.ca', 'uleth'),
    ('my.capilanou.ca', 'capilano'),
    ('capilanou.ca', 'capilano'),
    ('cbu.ca', 'cbu'),
    ('umoncton.ca', 'umoncton')
on conflict (domain) do nothing;
