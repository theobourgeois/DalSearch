/**
 * Checks a scrape before it's saved. A scraper rarely breaks loudly: a university changes its site
 * and the scrape comes back with half the sections, or every section without times, and saving it
 * would replace good data. So each run's numbers are compared with the last run that saved.
 *
 * Failures stop the save (refresh.js --force saves anyway, when the change is real). Warnings save
 * but mark the run, so a problem that lasts gets looked at.
 */

// Below this many sections a term is too small for its percentages to mean much.
const MIN_TERM_SECTIONS = 50;
// Refuse a scrape with much less than what's stored: the university probably blocked us or
// changed its site, and saving would delete good sections.
const MIN_SECTIONS_KEPT = 0.5;
// How far the share of sections with times, instructors or rooms may fall in a day.
const MAX_COVERAGE_DROP = 0.3;
const MAX_FAILED_SUBJECTS = 0.05;
// When every term on the timetable ends within this many days, the next one should be there.
const NEXT_TERM_DAYS = 14;

const COVERAGE = [
    ["withTimes", "have meeting times"],
    ["withInstructors", "have instructors"],
    ["withRooms", "have rooms"],
];

/**
 * The numbers a run is judged by, stored with it in refresh_runs.
 * @param {import("./import.js").Timetable} timetable
 */
export function measure(timetable) {
    const terms = {};
    for (const term of timetable.terms) {
        terms[term.code] = { name: term.name, ends_on: term.ends_on, sections: 0, withTimes: 0, withInstructors: 0, withRooms: 0 };
    }
    for (const section of timetable.sections) {
        const term = terms[section.term];
        if (!term) continue;
        term.sections++;
        if (section.meetings.some((meeting) => meeting.start_time)) term.withTimes++;
        if (section.instructors.length) term.withInstructors++;
        if (section.meetings.some((meeting) => meeting.rooms?.length)) term.withRooms++;
    }
    return {
        sections: timetable.sections.length,
        subjects: timetable.subjects.length,
        failedSubjects: timetable.failedSubjects,
        terms,
    };
}

const percent = (part, whole) => `${Math.round((100 * part) / whole)}%`;

/**
 * @param {ReturnType<typeof measure>} metrics This run's.
 * @param {{baseline: ReturnType<typeof measure>|null, storedSections: number, today: string}} context
 *     baseline is the last saved run's metrics; today is "2026-10-17".
 * @returns {{failures: string[], warnings: string[]}}
 */
export function checkHealth(metrics, { baseline, storedSections, today }) {
    const failures = [];
    const warnings = [];

    if (metrics.sections === 0) {
        failures.push("The scrape found no sections");
    } else if (metrics.sections < storedSections * MIN_SECTIONS_KEPT) {
        failures.push(`The scrape found ${metrics.sections} sections, but ${storedSections} are stored`);
    }

    for (const [code, before] of Object.entries(baseline?.terms ?? {})) {
        if (before.sections < MIN_TERM_SECTIONS) continue;
        const now = metrics.terms[code];
        if (!now) {
            if (before.ends_on >= today) {
                failures.push(`${before.name} isn't on the timetable any more (it had ${before.sections} sections)`);
            }
            continue;
        }
        if (now.sections < before.sections * MIN_SECTIONS_KEPT) {
            failures.push(`${before.name} has ${now.sections} sections, down from ${before.sections}`);
            continue;
        }
        for (const [key, label] of COVERAGE) {
            const was = before[key] / before.sections;
            const is = now[key] / now.sections;
            if (was - is > MAX_COVERAGE_DROP) {
                failures.push(
                    `In ${before.name}, ${percent(now[key], now.sections)} of sections ${label}, down from ${percent(before[key], before.sections)}`,
                );
            }
        }
    }

    const failed = metrics.failedSubjects.length;
    if (failed && failed > metrics.subjects * MAX_FAILED_SUBJECTS) {
        const listed = metrics.failedSubjects.slice(0, 10).join(", ");
        warnings.push(`${failed} of ${metrics.subjects} subjects failed to download: ${listed}${failed > 10 ? ", ..." : ""}`);
    }

    const ends = Object.values(metrics.terms).map((term) => term.ends_on);
    if (ends.length) {
        const latest = ends.sort().at(-1);
        const soon = new Date(`${today}T00:00:00Z`);
        soon.setUTCDate(soon.getUTCDate() + NEXT_TERM_DAYS);
        if (latest < soon.toISOString().slice(0, 10)) {
            warnings.push(`Every term on the timetable ends by ${latest}, and the next term isn't there`);
        }
    }

    return { failures, warnings };
}
