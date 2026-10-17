/**
 * Dalhousie: the timetable from Banner's academic timetable page on self-service.dal.ca, and
 * descriptions and requisites from academiccalendar.dal.ca. See ../lib/import.js for what this returns.
 */
import * as cheerio from "cheerio";
import { log } from "../lib/import.js";

const TIMETABLE = "https://self-service.dal.ca/BannerExtensibility/internalPb/virtualDomains";
const HEADERS = {
    accept: "application/json, text/plain, */*",
    "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    Referer: "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
};
const CALENDAR = "https://academiccalendar.dal.ca/Catalog/ViewCatalog.aspx?pageid=viewcatalog&entitytype=CID&entitycode=";
const DISTRICTS = "100;200;300;400;";
const CALENDAR_DELAY_MS = 500;

/** Banner's query parameters are base64 with a length-like prefix per field, copied from what the page sends. */
const ENCODED_LENGTHS = {
    crse_numb: ["64", "68"],
    page_num: ["45", "14"],
    offset: ["11", "14"],
    terms: ["19", "51"],
    page_size: ["77", "12"],
    max: ["60", "96"],
    subj_code: ["55", "33"],
    districts: ["36", "30"],
};

function encodeParams(params, lengths) {
    return Object.fromEntries(
        Object.entries(params).map(([key, value]) => {
            const [keyLength, valueLength] = lengths[key];
            const encoded = value === null ? `${btoa("69")}null` : `${btoa(valueLength)}${btoa(String(value))}`;
            return [`${btoa(keyLength)}${btoa(key)}`, encoded];
        }),
    );
}

async function fetchJson(url, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(url, { headers: HEADERS });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            if (attempt >= attempts) throw error;
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
    }
}

const seasons = { 10: ["fall", "Fall"], 20: ["winter", "Winter"], 30: ["summer", "Summer"] };

/** "202710" is Fall 2026: the code's year is the academic year's end. Medicine/Dentistry ("xx00") isn't a regular term. */
function describeTerm(code) {
    const [season, label] = seasons[code.slice(4)] ?? [];
    if (!season) return null;
    const year = Number(code.slice(0, 4)) - (season === "fall" ? 1 : 0);
    return { code, season, year, name: `${label} ${year}` };
}

async function getTermCodes() {
    const terms = await fetchJson(`${TIMETABLE}.dal_stuweb_academicTimetable_terms?encoded=true`);
    const codes = terms.map(({ CODE }) => CODE).filter((code) => describeTerm(code)).sort();
    if (codes.length === 0) throw new Error("No terms listed on the timetable");
    return codes;
}

async function getSubjects(termCodes) {
    const url = new URL(`${TIMETABLE}.dal_stuweb_academicTimetable_subjects`);
    url.search = new URLSearchParams({
        [btoa("30") + btoa("terms")]: btoa("81") + btoa(`${termCodes.join(";")};`),
        [btoa("39") + btoa("districts")]: btoa("99") + btoa(DISTRICTS),
        encoded: "true",
    }).toString();
    const subjects = await fetchJson(url);
    // "(ACSC) Actuarial Science" -> "Actuarial Science"
    return subjects.map(({ CODE, DESCR }) => ({
        code: CODE.trim().toUpperCase(),
        name: DESCR.replace(/^\([^)]*\)\s*/, "").trim() || CODE.trim(),
    }));
}

async function getSubjectRows(subject, termCodes) {
    const url = new URL(`${TIMETABLE}.dal_stuweb_academicTimetable`);
    const params = {
        crse_numb: null,
        page_num: "1",
        offset: "0",
        terms: termCodes.join(";"),
        page_size: "9999",
        max: "1000",
        subj_code: subject,
        districts: DISTRICTS,
    };
    url.search = new URLSearchParams({ ...encodeParams(params, ENCODED_LENGTHS), encoded: "true" }).toString();
    return fetchJson(url);
}

const kinds = {
    Lec: "lecture",
    Lab: "lab",
    Tut: "tutorial",
    Sem: "seminar",
    Std: "studio",
    Ths: "thesis",
    WkT: "work_term",
    Int: "internship",
    WkS: "workshop",
    Ens: "ensemble",
    Cln: "clinical",
    Fld: "field",
    Ind: "independent_study",
    Rdg: "independent_study",
};

const dayColumns = [
    ["MONDAYS", "M"],
    ["TUESDAYS", "T"],
    ["WEDNESDAYS", "W"],
    ["THURSDAYS", "R"],
    ["FRIDAYS", "F"],
    ["SATURDAYS", "S"],
    ["SUNDAYS", "U"],
];

const months = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

/** "08-SEP-2026" -> "2026-09-08". */
function parseDate(text) {
    const match = text?.trim().match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (!match || !months[match[2].toUpperCase()]) return null;
    const [, day, month, year] = match;
    return `${year}-${String(months[month.toUpperCase()]).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** "0835-0955" -> ["08:35", "09:55"], or nulls when there's no valid time ("C/D", blank). */
function parseTimes(text) {
    const match = text?.trim().match(/^(\d{2})(\d{2})-(\d{2})(\d{2})$/);
    if (!match) return [null, null];
    const [, startHour, startMinute, endHour, endMinute] = match.map(Number);
    if (startHour > 23 || endHour > 23 || startMinute > 59 || endMinute > 59) return [null, null];
    if (endHour * 60 + endMinute <= startHour * 60 + startMinute) return [null, null];
    return [match[1] + ":" + match[2], match[3] + ":" + match[4]];
}

const lines = (text) => (text ?? "").split(/<br\s*\/?>/i);
const stripTags = (text) => text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const optionalNumber = (value) => (value === null || value === undefined || String(value).trim() === "" ? null : Number(value));
const nonNegative = (value) => {
    const number = optionalNumber(value);
    return number === null || Number.isNaN(number) || number < 0 ? null : number;
};

const campuses = new Set(["Studley", "Carleton", "Sexton", "Truro", "Agricultural", "King's"]);
/** Words that stay uppercase when a building name is title-cased. */
const acronyms = new Set(["LSC", "MACME", "SUB", "CHEB", "IDEA", "CS", "II", "III", "IWK", "QEII"]);

/** "LSC-COMMON AREA" -> "LSC-Common Area". */
function titleCase(text) {
    const word = (part) => (acronyms.has(part.toUpperCase()) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1));
    return text
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.split("-").map(word).join("-"))
        .join(" ");
}

/**
 * Dal writes a meeting's place as "<campus> <BUILDING> <room>[, <room>...]": "Studley GOLDBERG COMPUTER
 * SCIENCE BLDG 127", "Sexton RALPH M MEDJUCK BLDG 1210, 2107", "Other FENWICK MEDICAL 204". Online
 * meetings ("Online-ASYNCHRONOUS SESSION") and unscheduled ones ("C/D", "Consult Department") have no room.
 * Returns readable text for the meeting and the rooms it's in.
 */
export function parseLocation(raw) {
    const text = (raw ?? "").replace(/\s+/g, " ").trim();
    if (!text || /^C\/D\b/i.test(text)) return { location: null, rooms: [] };
    if (/^consult department$/i.test(text)) return { location: "Consult department", rooms: [] };

    const online = text.match(/^Online-(.*)$/i);
    if (online) {
        const mode = [
            ...new Set(
                online[1]
                    .toLowerCase()
                    .split(/[\s,]+/)
                    .filter((word) => word && !["session", "online", "c/d", "deliver", "delivery"].includes(word)),
            ),
        ];
        return { location: mode.length ? `Online (${mode.join(" ")})` : "Online", rooms: [] };
    }

    const words = text.split(" ");
    let campus = null;
    if (campuses.has(words[0])) campus = words.shift();
    else if (words[0] === "Other") words.shift();
    const rest = words.join(" ");
    // The trailing comma-separated list is the rooms; everything before it is the building.
    const split = rest.match(/^(.*?)\s+(\S+(?:,\s*\S+)*)$/);
    const building = titleCase(split ? split[1] : rest);
    const roomNames = split ? split[2].split(/,\s*/).filter(Boolean) : [];
    if (!building) return { location: text, rooms: [] };
    return {
        location: [building, roomNames.join(", ")].filter(Boolean).join(" "),
        rooms: roomNames.length
            ? roomNames.map((room) => ({ campus, building, room }))
            : [{ campus, building, room: null }],
    };
}

/**
 * A row lists its meetings as parallel <br>-separated columns. When the room or dates change during
 * the term, LOCATIONS has a "*** 08-SEP-2026 - 22-OCT-2026 ***" line before each meeting's room.
 */
function parseMeetings(row, sectionStart, sectionEnd) {
    const times = lines(row.TIMES);
    const days = dayColumns.map(([column, day]) => [lines(row[column]), day]);
    const locations = lines(row.LOCATIONS).map(stripTags);
    const count = Math.max(times.length, ...days.map(([values]) => values.length));

    const meetings = [];
    let range = [sectionStart, sectionEnd];
    const ranges = locations.map((line) => {
        const match = line.match(/\*+\s*(\S+)\s*-\s*(\S+)\s*\*+/);
        if (match) range = [parseDate(match[1]) ?? sectionStart, parseDate(match[2]) ?? sectionEnd];
        return { isHeader: Boolean(match), range };
    });

    for (let index = 0; index < count; index++) {
        const meetingDays = days.filter(([values]) => values[index]?.trim()).map(([, day]) => day);
        const [start, end] = parseTimes(times[index]);
        const isHeader = ranges[index]?.isHeader;
        const place = parseLocation(!isHeader ? locations[index] : null);
        if (meetingDays.length === 0 && !start && !place.location) continue;
        // The range comes from the closest header above this line.
        const [startsOn, endsOn] = ranges[index]?.range ?? [sectionStart, sectionEnd];
        meetings.push({
            days: meetingDays,
            start_time: start,
            end_time: end,
            location: place.location,
            rooms: place.rooms,
            starts_on: startsOn,
            ends_on: endsOn && startsOn && endsOn < startsOn ? startsOn : endsOn,
        });
    }
    return meetings;
}

/** "Rudzicz F. (P)<br>Goudreault M. " -> primary first; "Staff" means nobody is assigned yet. */
function parseInstructors(text) {
    const people = new Map();
    for (const line of lines(text)) {
        const isPrimary = /\(P\)\s*$/.test(line);
        const name = stripTags(line.replace(/\(P\)\s*$/, ""));
        if (!name || name === "Staff") continue;
        people.set(name, (people.get(name) ?? false) || isPrimary);
    }
    return [...people].map(([name, is_primary]) => ({ name, is_primary }));
}

/** "202630-CHIN-3150,202630-GERM-3150" -> ["CHIN3150", "GERM3150"]. */
function parseCrossListings(text, ownCode) {
    const codes = [...(text ?? "").matchAll(/\d+-([A-Z0-9]+)-([A-Z0-9]+)/gi)].map(([, subject, number]) =>
        `${subject}${number}`.toUpperCase(),
    );
    return [...new Set(codes)].filter((code) => code !== ownCode);
}

function toSection(row) {
    const course = `${row.SUBJ_CODE}${row.CRSE_NUMB}`.trim().toUpperCase();
    const startsOn = parseDate(row.START_DATE);
    const endsOn = parseDate(row.END_DATE);
    const notes = row.NOTE_BOTTOM ? stripTags(row.NOTE_BOTTOM.replace(/<br\s*\/?>/gi, " ")) : "";
    return {
        term: row.TERM_CODE,
        crn: String(row.CRN).trim(),
        course,
        section: String(row.SEQ_NUMB ?? "").trim() || "-",
        type: String(row.SCHD_TYPE ?? "").trim() || "Other",
        kind: kinds[String(row.SCHD_TYPE ?? "").trim()] ?? "other",
        credits: nonNegative(row.CREDIT_HRS),
        capacity: nonNegative(row.MAX_ENRL),
        enrolled: nonNegative(row.ENRL),
        waitlist: nonNegative(row.WLIST),
        starts_on: startsOn,
        ends_on: endsOn && startsOn && endsOn < startsOn ? startsOn : endsOn,
        link_code: row.LINK_CONN?.trim() || null,
        cross_listed_codes: parseCrossListings(row.CRSE_EQUIV, course),
        notes: notes || null,
        meetings: parseMeetings(row, startsOn, endsOn),
        instructors: parseInstructors(row.INSTRUCTORS),
    };
}

function mostCommon(values) {
    const counts = new Map();
    for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** @returns {Promise<import("../lib/import.js").Timetable>} */
export async function scrapeTimetable() {
    const termCodes = await getTermCodes();
    log(`Terms on the timetable: ${termCodes.join(", ")}`);
    const subjects = await getSubjects(termCodes);
    log(`${subjects.length} subjects`);

    const rows = [];
    const failedSubjects = [];
    for (const [index, subject] of subjects.entries()) {
        try {
            const subjectRows = await getSubjectRows(subject.code, termCodes);
            rows.push(...subjectRows);
            log(`[${index + 1}/${subjects.length}] ${subject.code}: ${subjectRows.length} sections`);
        } catch (error) {
            failedSubjects.push(subject.code);
            log(`[${index + 1}/${subjects.length}] ${subject.code} failed: ${error.message}`);
        }
    }

    const sections = new Map();
    const courses = new Map();
    const subjectCodes = new Set(subjects.map((subject) => subject.code));
    const extraSubjects = [];
    // Latest term last, so a course takes its title from the latest term it runs in.
    rows.sort((a, b) => String(a.TERM_CODE).localeCompare(String(b.TERM_CODE)));
    for (const row of rows) {
        if (!termCodes.includes(row.TERM_CODE)) continue;
        const subjectCode = String(row.SUBJ_CODE ?? "").trim().toUpperCase();
        const number = String(row.CRSE_NUMB ?? "").trim().toUpperCase();
        if (!/^[A-Z0-9]{1,10}$/.test(subjectCode) || !/^[A-Z0-9]{1,10}$/.test(number) || !row.CRN) {
            log(`Skipping a malformed row: ${JSON.stringify(row).slice(0, 200)}`);
            continue;
        }
        const section = toSection(row);
        sections.set(`${section.term} ${section.crn}`, section);

        const existing = courses.get(section.course);
        courses.set(section.course, {
            code: section.course,
            subject_code: subjectCode,
            number,
            title: String(row.CRSE_TITLE ?? "").trim() || existing?.title || section.course,
            // Labs and tutorials are often listed with 0 credits, so the course is worth its largest section.
            credits: Math.max(existing?.credits ?? 0, section.credits ?? 0),
        });
        if (!subjectCodes.has(subjectCode)) {
            subjectCodes.add(subjectCode);
            extraSubjects.push({ code: subjectCode, name: subjectCode });
        }
    }

    // A term's dates are the ones most of its sections run between.
    const allSections = [...sections.values()];
    const terms = termCodes
        .map((code) => {
            const termSections = allSections.filter((section) => section.term === code);
            const starts_on = mostCommon(termSections.map((section) => section.starts_on));
            const ends_on = mostCommon(termSections.map((section) => section.ends_on));
            if (!starts_on || !ends_on) return null;
            return { ...describeTerm(code), starts_on, ends_on: ends_on < starts_on ? starts_on : ends_on };
        })
        .filter(Boolean);

    return {
        terms,
        subjects: [...subjects, ...extraSubjects],
        courses: [...courses.values()],
        sections: allSections,
        failedSubjects,
    };
}

const entities = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

function plainText(html) {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&[a-z#0-9]+;/gi, (entity) => entities[entity.toLowerCase()] ?? entity)
        .replace(/[ \t\r\f\v]+/g, " ")
        .replace(/\s*\n\s*/g, "\n")
        .trim();
}

const requisiteLabels = { PREREQUISITES: "prerequisite", COREQUISITES: "corequisite", EXCLUSIONS: "exclusion" };

/** The calendar page's description and its "PREREQUISITES: ..." style lines. */
function parseCalendarPage(html, code, knownCodes) {
    const $ = cheerio.load(html);
    // A course the calendar doesn't list gets a page titled just "Welcome".
    if ($(".catalogtitle").text().trim() === "Welcome") {
        return { code, description: null, requisites_text: null, requisites: [] };
    }
    const text = plainText($(".maincontent").html() ?? "");
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const creditsLine = lines.findIndex((line) => /^CREDIT HOURS:/i.test(line));
    if (creditsLine === -1) return null;

    const labelled = (line) => line.match(/^([A-Z][A-Z -]+):\s*(.*)$/);
    const description = lines[creditsLine + 1] && !labelled(lines[creditsLine + 1]) ? lines[creditsLine + 1] : null;
    const requisiteLines = [];
    const requisites = [];
    for (const line of lines.slice(creditsLine + 1)) {
        const match = labelled(line);
        const kind = match && requisiteLabels[match[1].trim().toUpperCase()];
        if (!kind) continue;
        requisiteLines.push(line);
        for (const [, subject, number] of match[2].matchAll(/\b([A-Z]{4})\s*(\d{4})\b/g)) {
            const required = `${subject}${number}`;
            if (required !== code && knownCodes.has(required)) requisites.push({ code: required, kind });
        }
    }
    return {
        code,
        description,
        requisites_text: requisiteLines.join("\n") || null,
        requisites: [...new Map(requisites.map((requisite) => [`${requisite.kind} ${requisite.code}`, requisite])).values()],
    };
}

/**
 * A course's calendar page, parsed. Every real page has a "CREDIT HOURS" line, so a page without one is
 * an error page (the calendar is flaky under load) and is fetched again.
 */
async function fetchCalendarPage(course, knownCodes, attempts = 3) {
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(`${CALENDAR}${course.subject_code}+${course.number}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const details = parseCalendarPage(await response.text(), course.code, knownCodes);
            if (!details) throw new Error("no course on the page");
            return details;
        } catch (error) {
            if (attempt >= attempts) throw error;
            await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
        }
    }
}

/**
 * Descriptions and requisites, one calendar page per course, in batches.
 * @param {{code: string, subject_code: string, number: string}[]} courses
 * @param {Set<string>} knownCodes Every course code stored for Dal, to recognise requisites.
 * @returns {AsyncGenerator<import("../lib/import.js").CourseDetails[]>}
 */
export async function* scrapeCourseDetails(courses, knownCodes, batchSize = 100) {
    let batch = [];
    let withoutDescription = 0;
    const failed = [];
    for (const [index, course] of courses.entries()) {
        try {
            const details = await fetchCalendarPage(course, knownCodes);
            // A page without a description is left alone rather than wiping what's stored.
            if (details.description) batch.push(details);
            else withoutDescription++;
        } catch (error) {
            failed.push(course.code);
            log(`${course.code}: ${error.message}`);
        }
        if (batch.length >= batchSize) {
            log(`[${index + 1}/${courses.length}] course details`);
            yield batch;
            batch = [];
        }
        await new Promise((resolve) => setTimeout(resolve, CALENDAR_DELAY_MS));
    }
    if (batch.length) yield batch;
    log(
        `Course details done: ${withoutDescription} courses have no description in the calendar, ` +
            `${failed.length} pages couldn't be read${failed.length ? ` (${failed.slice(0, 20).join(", ")})` : ""}`,
    );
}

/**
 * Dal posts final exams as a table per subject, copied from its exam schedule page:
 *
 *     ACSC
 *     Course	Section	Date	Start Time
 *     ACSC3703 W	1	2025-04-12	3:30:00 PM
 *
 * Returns exams with local start times ("2025-04-12T15:30"); the runner applies the timezone.
 */
export function parseExams(text) {
    const exams = [];
    for (const line of text.split(/\r?\n/)) {
        const [course, section, date, time] = line.split("\t").map((cell) => cell?.trim());
        const code = course?.match(/^([A-Z]{4}\d{4})\b/)?.[1];
        const clock = time?.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
        if (!code || !section || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !clock) continue;
        const hours = (Number(clock[1]) % 12) + (clock[3].toUpperCase() === "PM" ? 12 : 0);
        exams.push({ course: code, section, starts_at: `${date}T${String(hours).padStart(2, "0")}:${clock[2]}` });
    }
    return exams;
}
