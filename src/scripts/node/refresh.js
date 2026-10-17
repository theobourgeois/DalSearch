/**
 * Refreshes one university's timetable and course details in Supabase.
 *
 *     node refresh.js dal                    # timetable, then every course's description and requisites
 *     node refresh.js dal --details missing  # only fetch details for courses that have none
 *     node refresh.js dal --details none     # timetable only, a few minutes
 *
 * Each university has a scraper in universities/<id>.js exporting scrapeTimetable() and, if its
 * calendar can be read, scrapeCourseDetails(). See lib/import.js for what they return.
 */
import { chunk, connect, log } from "./lib/import.js";

const SUBJECTS_PER_IMPORT = 20;
// Refuse to save a scrape with much less than what's stored: the university probably blocked us or
// changed its site, and saving would delete good sections.
const MIN_SECTIONS_KEPT = 0.5;

function parseArgs(argv) {
    const [university, ...rest] = argv;
    if (!university || !/^[a-z0-9-]+$/.test(university)) {
        throw new Error("Usage: node refresh.js <university> [--details all|missing|none]");
    }
    const flag = rest.indexOf("--details");
    const details = flag === -1 ? "all" : rest[flag + 1];
    if (!["all", "missing", "none"].includes(details)) throw new Error("--details is all, missing or none");
    return { university, details };
}

async function importTimetable(db, university, timetable) {
    const listedCodes = timetable.terms.map((term) => term.code);
    const stored = await db.count("catalog_sections", { university_id: `eq.${university}` });
    log(`Scraped ${timetable.sections.length} sections in ${listedCodes.length} terms; ${stored} stored`);
    if (timetable.sections.length === 0 || timetable.sections.length < stored * MIN_SECTIONS_KEPT) {
        throw new Error(`Only scraped ${timetable.sections.length} sections (${stored} stored), not saving`);
    }

    await db.rpc("import_terms", { p_university: university, p_terms: timetable.terms });

    // A subject that's stored but no longer on the timetable has had all its sections removed, so it
    // goes in the scope with no sections. Subjects that failed to download are left out and keep theirs.
    const storedSubjects = await db.selectAll("subjects", "code", { university_id: `eq.${university}` }, "code");
    const failed = new Set(timetable.failedSubjects);
    const scraped = new Map(timetable.subjects.map((subject) => [subject.code, subject]));
    const subjectCodes = [...new Set([...scraped.keys(), ...storedSubjects.map((subject) => subject.code)])]
        .filter((code) => !failed.has(code))
        .sort();
    if (failed.size) log(`Keeping stored sections for subjects that failed: ${[...failed].join(", ")}`);

    const totals = { sections: 0, deleted: 0 };
    for (const codes of chunk(subjectCodes, SUBJECTS_PER_IMPORT)) {
        const inChunk = new Set(codes);
        const courses = timetable.courses.filter((course) => inChunk.has(course.subject_code));
        const courseCodes = new Set(courses.map((course) => course.code));
        const result = await db.rpc("import_timetable", {
            p_university: university,
            p_payload: {
                scope: listedCodes.flatMap((term) => codes.map((subject) => ({ term, subject }))),
                subjects: codes.map((code) => scraped.get(code)).filter(Boolean),
                courses,
                sections: timetable.sections.filter((section) => courseCodes.has(section.course)),
            },
        });
        totals.sections += result.sections;
        totals.deleted += result.deleted;
        log(`Saved ${codes[0]}-${codes.at(-1)}: ${result.sections} sections, ${result.deleted} removed`);
    }

    await db.rpc("list_terms", { p_university: university, p_codes: listedCodes });
    log(`Timetable saved: ${totals.sections} sections, ${totals.deleted} removed; listed ${listedCodes.join(", ")}`);
}

async function importDetails(db, university, scraper, timetable, mode) {
    if (mode === "none") return;
    if (!scraper.scrapeCourseDetails) {
        log("This university's scraper doesn't read course details");
        return;
    }

    const stored = await db.selectAll("courses", "code,description", { university_id: `eq.${university}` }, "code");
    const knownCodes = new Set(stored.map((course) => course.code));
    const withDescription = new Set(stored.filter((course) => course.description).map((course) => course.code));
    const courses = timetable.courses.filter((course) => mode === "all" || !withDescription.has(course.code));
    log(`Fetching details for ${courses.length} courses`);

    let saved = 0;
    for await (const batch of scraper.scrapeCourseDetails(courses, knownCodes)) {
        saved += await db.rpc("import_course_details", { p_university: university, p_courses: batch });
    }
    log(`Saved details for ${saved} courses`);
}

async function main() {
    const { university, details } = parseArgs(process.argv.slice(2));
    const scraper = await import(`./universities/${university}.js`);
    const db = connect();

    const timetable = await scraper.scrapeTimetable();
    await importTimetable(db, university, timetable);
    await importDetails(db, university, scraper, timetable, details);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
