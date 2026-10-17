/**
 * Saint Mary's University: the timetable from its Banner 9 Self-Service class search (see
 * ../lib/banner9.js), and descriptions and prerequisites from its CourseLeaf catalog.
 */
import { banner9, decode } from "../lib/banner9.js";
import { log } from "../lib/import.js";

const CATALOG = "https://smu-ca-public.courseleaf.com/course-search/api/?page=fose";
const CONCURRENCY = 4;

const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
];

/** "September - December 2026" -> the months it spans and the year. */
function monthRange(description) {
    const match = description.toLowerCase().match(/([a-z]+)\s*-\s*([a-z]+)\s+(\d{4})/);
    if (!match) return null;
    const [from, to] = [months.indexOf(match[1]), months.indexOf(match[2])];
    return from < 0 || to < 0 ? null : { from, to, year: Number(match[3]) };
}

/**
 * SMU names terms by their months: "September - December 2026", "May - June 2026", "May - August 2026
 * (Graduate)". Summer has several, so they keep the months: "Summer 2026 (May-June)".
 */
function describeTerm({ description, starts_on }) {
    const range = monthRange(description);
    const year = Number(starts_on.slice(0, 4));
    const start = range?.from ?? Number(starts_on.slice(5, 7)) - 1;
    if (start >= 8) return { name: `Fall ${year}`, season: "fall", year };
    if (start <= 2) return { name: `Winter ${year}`, season: "winter", year };
    const label = (index) => months[index][0].toUpperCase() + months[index].slice(1);
    const span = range ? `${label(range.from)}-${label(range.to)}` : null;
    const graduate = /graduate/i.test(description) ? "graduate" : null;
    const detail = [span, graduate].filter(Boolean).join(", ");
    return { name: `Summer ${year}${detail ? ` (${detail})` : ""}`, season: "summer", year };
}

/** The last day of the term's last month, from its name. */
function roughEnd({ description }) {
    const range = monthRange(description);
    if (!range) return null;
    const last = new Date(Date.UTC(range.year, range.to + 1, 0));
    return last.toISOString().slice(0, 10);
}

// SMU's CourseLeaf catalog has fuller descriptions than Banner's, so its own scrapeCourseDetails below is used.
export const { scrapeTimetable } = banner9({
    baseUrl: "https://reg-prod.ec.smu.ca/StudentRegistrationSsb/ssb",
    describeTerm,
    roughEnd,
    isOnline: (meeting, section) =>
        !meeting.building || /online|asynchronous/i.test(section.instructionalMethodDescription ?? ""),
});

async function catalog(route, body) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(`${CATALOG}&route=${route}`, {
                method: "POST",
                headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (attempt >= 3) throw error;
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
    }
}

const plain = (html) =>
    decode(
        String(html ?? "")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]+>/g, " "),
    )
        .replace(/\s+([.,;:])/g, "$1")
        .trim();

/**
 * Descriptions and prerequisites from the catalog: one search per subject for the courses' keys, then
 * one details request per course.
 * @returns {AsyncGenerator<import("../lib/import.js").CourseDetails[]>}
 */
export async function* scrapeCourseDetails(courses, knownCodes, batchSize = 100) {
    const bySubject = new Map();
    for (const course of courses)
        bySubject.set(course.subject_code, [...(bySubject.get(course.subject_code) ?? []), course]);

    let batch = [];
    let missing = 0;
    let done = 0;
    for (const [subject, wanted] of bySubject) {
        let found;
        try {
            found = await catalog("search", { other: { srcdb: "" }, criteria: [{ field: "subject", value: subject }] });
        } catch (error) {
            log(`Catalog search for ${subject} failed: ${error.message}`);
            missing += wanted.length;
            continue;
        }
        const keys = new Map(
            (found.results ?? []).map((result) => [result.code.replace(/\s+/g, "").toUpperCase(), result]),
        );

        for (let start = 0; start < wanted.length; start += CONCURRENCY) {
            const details = await Promise.all(
                wanted.slice(start, start + CONCURRENCY).map(async (course) => {
                    const entry = keys.get(course.code);
                    if (!entry) return null;
                    try {
                        const detail = await catalog("details", {
                            group: `code:${entry.code}`,
                            key: `key:${entry.key}`,
                            srcdb: entry.srcdb ?? found.srcdb,
                            matched: `key:${entry.key}`,
                        });
                        const requisitesText = plain(detail.prerequisites_);
                        const requisites = [...requisitesText.toUpperCase().matchAll(/\b([A-Z]{3,4})\s*(\d{4})\b/g)]
                            .map(([, letters, number]) => `${letters}${number}`)
                            .filter((code) => code !== course.code && knownCodes.has(code))
                            .map((code) => ({ code, kind: "prerequisite" }));
                        return {
                            code: course.code,
                            description: plain(detail.description) || null,
                            requisites_text: requisitesText ? `Prerequisites: ${requisitesText}` : null,
                            requisites: [
                                ...new Map(requisites.map((requisite) => [requisite.code, requisite])).values(),
                            ],
                        };
                    } catch (error) {
                        log(`${course.code}: ${error.message}`);
                        return null;
                    }
                }),
            );
            for (const detail of details) {
                if (detail?.description) batch.push(detail);
                else missing++;
            }
            done += Math.min(CONCURRENCY, wanted.length - start);
            if (batch.length >= batchSize) {
                log(`[${done}/${courses.length}] course details`);
                yield batch;
                batch = [];
            }
        }
    }
    if (batch.length) yield batch;
    log(`Course details done; ${missing} of ${courses.length} had no catalog entry or description`);
}
