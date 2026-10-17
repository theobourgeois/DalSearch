/**
 * Ellucian Banner 9 Self-Service (StudentRegistrationSsb) class search, which answers without signing
 * in at most universities that run it. One university's scraper configures this with its address and
 * whatever it does differently; see universities/smu.js.
 *
 * The search returns sections; meetings, instructors and final exams come from one request per section.
 */
import { log } from "./import.js";

const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const PAGE_SIZE = 500;
const CONCURRENCY = 4;
const REQUEST_DELAY_MS = 120;

const entities = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#039;": "'", "&nbsp;": " " };
/** Banner sends text HTML-encoded: "Theol &amp; Rel Studies". */
export const decode = (text) =>
    String(text ?? "")
        .replace(/&[a-z#0-9]+;/gi, (entity) => entities[entity.toLowerCase()] ?? entity)
        .replace(/\s+/g, " ")
        .trim();

/** A Banner session: the cookies its class search keeps the chosen term in. */
async function openSession(base) {
    const cookies = new Map();
    const keep = (response) => {
        for (const cookie of response.headers.getSetCookie()) {
            const [pair] = cookie.split(";");
            const [name, ...value] = pair.split("=");
            cookies.set(name.trim(), value.join("="));
        }
    };
    const request = async (path, { method = "GET", form, attempts = 3 } = {}) => {
        for (let attempt = 1; ; attempt++) {
            try {
                const response = await fetch(`${base}/${path}`, {
                    method,
                    headers: {
                        "user-agent": USER_AGENT,
                        accept: "application/json, text/javascript, */*",
                        "x-requested-with": "XMLHttpRequest",
                        cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "),
                        ...(form ? { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" } : {}),
                    },
                    body: form ? new URLSearchParams(form).toString() : undefined,
                });
                keep(response);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const text = await response.text();
                return text ? JSON.parse(text) : null;
            } catch (error) {
                if (attempt >= attempts) throw new Error(`${path.split("?")[0]}: ${error.message}`);
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    };
    await request("term/termSelection?mode=search").catch(() => null);
    return request;
}

const uniqueSessionId = () => `ds${Math.random().toString(36).slice(2, 12)}`;

/** Every section in a term. A fresh session per term, since Banner keeps the chosen term in the session. */
async function searchTerm(base, term) {
    const request = await openSession(base);
    const session = uniqueSessionId();
    await request("term/search?mode=search", {
        method: "POST",
        form: { term, studyPath: "", studyPathText: "", startDatepicker: "", endDatepicker: "", uniqueSessionId: session },
    });
    const sections = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const params = new URLSearchParams({
            txt_term: term,
            startDatepicker: "",
            endDatepicker: "",
            uniqueSessionId: session,
            pageOffset: String(offset),
            pageMaxSize: String(PAGE_SIZE),
            sortColumn: "subjectDescription",
            sortDirection: "asc",
        });
        const page = await request(`searchResults/searchResults?${params}`);
        if (!page?.success) throw new Error(`Search failed for ${term}`);
        sections.push(...(page.data ?? []));
        if (sections.length >= (page.totalCount ?? 0) || !page.data?.length) break;
    }
    const subjects = await request(`classSearch/get_subject?searchTerm=&term=${term}&offset=1&max=1000`);
    return { request, sections, subjects: subjects ?? [] };
}

/** Runs `task` over `items` a few at a time, pausing between batches. */
async function inBatches(items, task, onProgress) {
    const results = [];
    for (let start = 0; start < items.length; start += CONCURRENCY) {
        results.push(...(await Promise.all(items.slice(start, start + CONCURRENCY).map(task))));
        onProgress?.(Math.min(start + CONCURRENCY, items.length));
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
    }
    return results;
}

/** "09/09/2026" -> "2026-09-09". */
const isoDate = (text) => {
    const match = String(text ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[1]}-${match[2]}` : null;
};
/** "1430" -> "14:30". */
const clock = (text) => (/^\d{4}$/.test(text ?? "") ? `${text.slice(0, 2)}:${text.slice(2)}` : null);

const dayColumns = [
    ["monday", "M"],
    ["tuesday", "T"],
    ["wednesday", "W"],
    ["thursday", "R"],
    ["friday", "F"],
    ["saturday", "S"],
    ["sunday", "U"],
];

const kinds = [
    [/lab/i, "Lab", "lab"],
    [/tutorial|recitation/i, "Tut", "tutorial"],
    [/seminar/i, "Sem", "seminar"],
    [/studio/i, "Std", "studio"],
    [/thesis/i, "Ths", "thesis"],
    [/practicum|placement|clinical/i, "Prac", "clinical"],
    [/co-?op|work term/i, "WkT", "work_term"],
    [/internship/i, "Int", "internship"],
    [/field/i, "Fld", "field"],
    [/directed|independent|reading/i, "Ind", "independent_study"],
    [/non.?course/i, "Other", "other"],
    [/lecture|class/i, "Lec", "lecture"],
];

/** Banner's schedule type ("Lecture", "AST Lecture", "Recitation") as a short label and a shared kind. */
function classify(description) {
    const match = kinds.find(([pattern]) => pattern.test(description ?? ""));
    return match ? { type: match[1], kind: match[2] } : { type: decode(description) || "Other", kind: "other" };
}

/** "Dr Paul Muir" -> "Paul Muir". */
const cleanName = (name) =>
    decode(name)
        .replace(/^(dr|prof|professor|mr|mrs|ms|mx)\.?\s+/i, "")
        .trim();

function mostCommon(values) {
    const counts = new Map();
    for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/**
 * @param {object} config
 * @param {string} config.baseUrl ".../StudentRegistrationSsb/ssb"
 * @param {number} [config.recentTerms] How many of the newest terms to look at (default 6).
 * @param {number} [config.keepEndedDays] Keep a term this many days after it ends (default 120).
 * @param {(term: {code: string, description: string, starts_on: string, ends_on: string}) => {name: string, season: string, year: number}} config.describeTerm
 * @param {(listing: {code: string, description: string}) => string | null} [config.roughEnd] When the term ends
 *   ("2026-04-30"), from its name, so finished terms are skipped before their sections are read.
 * @param {(meeting: object) => boolean} [config.isOnline]
 */
export function banner9({ baseUrl, recentTerms = 6, keepEndedDays = 120, describeTerm, roughEnd, isOnline }) {
    /** @returns {Promise<import("./import.js").Timetable & {exams: object[]}>} */
    return async function scrapeTimetable() {
        const request = await openSession(baseUrl);
        const listed = (await request(`classSearch/getTerms?searchTerm=&offset=1&max=${recentTerms}`)) ?? [];
        log(`Newest terms: ${listed.map((term) => `${term.code} (${decode(term.description)})`).join(", ")}`);
        const cutoff = new Date(Date.now() - keepEndedDays * 86_400_000).toISOString().slice(0, 10);

        const terms = [];
        const sections = [];
        const exams = [];
        const subjects = new Map();
        const courses = new Map();
        const failedSubjects = new Set();

        for (const listing of listed) {
            const roughlyEnds = roughEnd?.({ code: listing.code, description: decode(listing.description) });
            if (roughlyEnds && roughlyEnds < cutoff) {
                log(`${listing.code} (${decode(listing.description)}) is over, skipping`);
                continue;
            }
            const { request: termRequest, sections: found, subjects: termSubjects } = await searchTerm(baseUrl, listing.code);
            if (found.length === 0) {
                log(`${listing.code}: no sections`);
                continue;
            }
            for (const subject of termSubjects) subjects.set(subject.code, { code: subject.code, name: decode(subject.description) });

            const details = await inBatches(
                found,
                async (section) => {
                    try {
                        const meetings = await termRequest(
                            `searchResults/getFacultyMeetingTimes?term=${listing.code}&courseReferenceNumber=${section.courseReferenceNumber}`,
                        );
                        return { section, meetings: meetings?.fmt ?? [] };
                    } catch (error) {
                        failedSubjects.add(section.subject);
                        log(`${listing.code} ${section.subject}${section.courseNumber}-${section.sequenceNumber}: ${error.message}`);
                        return { section, meetings: null };
                    }
                },
                (done) => {
                    if (done % 200 < CONCURRENCY) log(`[${listing.code}] ${done}/${found.length} sections`);
                },
            );

            const termSections = [];
            for (const { section, meetings } of details) {
                if (meetings === null) continue;
                const code = `${section.subject}${section.courseNumber}`.toUpperCase();
                if (!/^[A-Z0-9]{2,20}$/.test(code)) continue;
                const credits = section.creditHours ?? section.creditHourLow ?? section.creditHourHigh ?? null;
                const existing = courses.get(code);
                courses.set(code, {
                    code,
                    subject_code: section.subject.toUpperCase(),
                    number: String(section.courseNumber).toUpperCase(),
                    title: existing?.title ?? (decode(section.courseTitle) || code),
                    credits: Math.max(existing?.credits ?? 0, credits ?? 0),
                });
                if (!subjects.has(section.subject)) {
                    subjects.set(section.subject, { code: section.subject, name: decode(section.subjectDescription) });
                }

                const classes = meetings.filter((entry) => !/exam/i.test(entry.meetingTime?.meetingTypeDescription ?? ""));
                const people = new Map();
                for (const entry of meetings) {
                    for (const person of entry.faculty ?? []) {
                        const name = cleanName(person.displayName);
                        if (name) people.set(name, (people.get(name) ?? false) || Boolean(person.primaryIndicator));
                    }
                }
                const dates = classes.map((entry) => [isoDate(entry.meetingTime.startDate), isoDate(entry.meetingTime.endDate)]);
                const startsOn = dates.map(([start]) => start).filter(Boolean).sort()[0] ?? null;
                const endsOn = dates.map(([, end]) => end).filter(Boolean).sort().at(-1) ?? null;

                termSections.push({
                    term: listing.code,
                    crn: String(section.courseReferenceNumber),
                    course: code,
                    section: String(section.sequenceNumber ?? "").trim() || "-",
                    ...classify(section.scheduleTypeDescription),
                    credits,
                    capacity: section.maximumEnrollment ?? null,
                    enrolled: section.enrollment ?? null,
                    waitlist: section.waitCount ?? null,
                    starts_on: startsOn,
                    ends_on: endsOn && startsOn && endsOn < startsOn ? startsOn : endsOn,
                    link_code: section.linkIdentifier ?? null,
                    cross_listed_codes: [],
                    notes: null,
                    meetings: classes.map(({ meetingTime: meeting }) => {
                        const start = clock(meeting.beginTime);
                        const end = clock(meeting.endTime);
                        const timed = start && end && end > start;
                        const online = isOnline?.(meeting, section) ?? !meeting.building;
                        const building = decode(meeting.buildingDescription);
                        const room = decode(meeting.room);
                        return {
                            days: dayColumns.filter(([column]) => meeting[column]).map(([, day]) => day),
                            start_time: timed ? start : null,
                            end_time: timed ? end : null,
                            location: online
                                ? decode(section.instructionalMethodDescription) || "Online"
                                : [building, room].filter(Boolean).join(" ") || null,
                            rooms:
                                online || !building
                                    ? []
                                    : [{ campus: decode(meeting.campusDescription) || null, building, room: room || null }],
                            starts_on: isoDate(meeting.startDate),
                            ends_on: isoDate(meeting.endDate),
                        };
                    }),
                    instructors: [...people]
                        .sort((a, b) => Number(b[1]) - Number(a[1]))
                        .map(([name, is_primary]) => ({ name, is_primary })),
                });

                for (const { meetingTime: exam } of meetings.filter((entry) => /exam/i.test(entry.meetingTime?.meetingTypeDescription ?? ""))) {
                    const day = isoDate(exam.startDate);
                    const start = clock(exam.beginTime);
                    if (!day || !start) continue;
                    const end = clock(exam.endTime);
                    exams.push({
                        term: listing.code,
                        course: code,
                        section: String(section.sequenceNumber ?? "").trim(),
                        starts_at: `${day}T${start}`,
                        ends_at: end && end > start ? `${day}T${end}` : null,
                        location: [decode(exam.buildingDescription), decode(exam.room)].filter(Boolean).join(" ") || null,
                    });
                }
            }

            const termStart = mostCommon(termSections.map((section) => section.starts_on));
            const termEnd = mostCommon(termSections.map((section) => section.ends_on));
            if (!termStart || !termEnd) {
                log(`${listing.code}: no dated sections, skipping`);
                continue;
            }
            if (termEnd < cutoff) {
                log(`${listing.code} ended ${termEnd}, skipping`);
                continue;
            }
            const description = decode(listing.description).replace(/\s*\(View Only\)\s*/i, "");
            terms.push({
                code: listing.code,
                ...describeTerm({ code: listing.code, description, starts_on: termStart, ends_on: termEnd }),
                starts_on: termStart,
                ends_on: termEnd < termStart ? termStart : termEnd,
            });
            sections.push(...termSections);
            log(`${listing.code} (${description}): ${termSections.length} sections, ${exams.filter((exam) => exam.term === listing.code).length} exams`);
        }

        const kept = new Set(terms.map((term) => term.code));
        const keptSections = sections.filter((section) => kept.has(section.term));
        const usedCourses = new Set(keptSections.map((section) => section.course));
        return {
            terms,
            subjects: [...subjects.values()].filter((subject) => /^[A-Z0-9]{1,10}$/.test(subject.code)),
            courses: [...courses.values()].filter((course) => usedCourses.has(course.code)),
            sections: keptSections,
            exams: exams.filter((exam) => kept.has(exam.term) && usedCourses.has(exam.course)),
            failedSubjects: [...failedSubjects],
        };
    };
}
