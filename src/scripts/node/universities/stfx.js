/**
 * St. Francis Xavier University: the timetable and course descriptions from its Banner 9
 * Self-Service class search (see ../lib/banner9.js), which answers without signing in.
 *
 * StFX registers September to April as one Banner term, "Full Academic Year 2026-2027", with fall
 * and winter sections told apart only by their dates. It's split here into Fall 2026 and Winter 2027
 * ("202710-FA" and "202710-WI") so a schedule doesn't mix the two; sections that run all year are in both.
 */
import { banner9 } from "../lib/banner9.js";

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The last day of a month: (2027, 3) -> "2027-04-30". */
const lastDay = (year, month) => new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);

/**
 * StFX's terms: "Full Academic Year 2026-2027" (split below), "Spring 2027" (May and June),
 * "Summer 2026" (July and August), and older multi-year ones like "Apr 2022 to Mar 2024".
 */
function describeTerm({ description, starts_on }) {
    const year = Number(starts_on.slice(0, 4));
    const academic = description.match(/full academic year\s+(\d{4})\s*-\s*(\d{4})/i);
    if (academic) return { name: `${academic[1]}-${academic[2]}`, season: "full_year", year: Number(academic[1]) };
    if (/^spring\b/i.test(description)) return { name: `Spring ${year}`, season: "spring", year };
    if (/^summer\b/i.test(description)) return { name: `Summer ${year}`, season: "summer", year };
    if (/^fall\b/i.test(description)) return { name: `Fall ${year}`, season: "fall", year };
    if (/^winter\b/i.test(description)) return { name: `Winter ${year}`, season: "winter", year };
    return { name: description, season: "other", year };
}

/** When a term ends, roughly, from its name. */
function estimatedEnd({ description }) {
    const academic = description.match(/full academic year\s+\d{4}\s*-\s*(\d{4})/i);
    if (academic) return `${academic[1]}-04-30`;
    const year = Number(description.match(/(\d{4})(?!.*\d{4})/)?.[1]);
    if (!year) return null;
    if (/^spring\b/i.test(description)) return `${year}-06-30`;
    if (/^summer\b/i.test(description)) return `${year}-08-31`;
    const until = description.toLowerCase().match(/\bto\s+([a-z]{3})[a-z]*\s+(\d{4})/);
    if (until && months.includes(until[1])) return lastDay(Number(until[2]), months.indexOf(until[1]));
    return null;
}

// Keeps a term this long after it ends: drops last spring (it ends in June) while keeping the summer
// into the fall.
const KEEP_ENDED_DAYS = 90;
const cutoff = () => new Date(Date.now() - KEEP_ENDED_DAYS * 86_400_000).toISOString().slice(0, 10);

// banner9 dates a term by its most common section end, which for the full year is December, so it
// would drop the year in March while winter classes still run. Ended terms are dropped here instead:
// roughEnd skips the ones that are clearly over before they're read, and scrapeTimetable below the
// rest, by the split terms' own dates.
const banner = banner9({
    baseUrl: "https://bannerss.stfx.ca/StudentRegistrationSsb/ssb",
    keepEndedDays: 36_500,
    describeTerm,
    roughEnd: (listing) => {
        const end = estimatedEnd(listing);
        return end && end < cutoff() ? "1900-01-01" : null;
    },
    isOnline: (meeting, section) =>
        !meeting.building ||
        /online|distance/i.test(section.instructionalMethodDescription ?? "") ||
        /^(online|distance)$/i.test(section.campusDescription ?? ""),
});

export const { scrapeCourseDetails } = banner;

/** "Cai, Hao" -> "Hao Cai". */
const firstLast = (name) => name.replace(/^([^,]+),\s*(.+)$/, "$2 $1").trim();

function mostCommon(values) {
    const counts = new Map();
    for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
}

/** Whether a meeting (or its undated self) falls in [from, to]. */
const overlaps = (meeting, from, to) =>
    (!meeting.starts_on || meeting.starts_on <= to) && (!meeting.ends_on || meeting.ends_on >= from);

/**
 * Fall and Winter out of a full-year term. Sections are put in the half their dates fall in; a
 * section running September to April, or with no dates at all, is in both, with each half's meetings.
 */
function splitAcademicYear(term, sections, exams) {
    const halves = [
        {
            code: `${term.code}-FA`,
            name: `Fall ${term.year}`,
            season: "fall",
            year: term.year,
            from: `${term.year}-07-01`,
            to: `${term.year}-12-31`,
        },
        {
            code: `${term.code}-WI`,
            name: `Winter ${term.year + 1}`,
            season: "winter",
            year: term.year + 1,
            from: `${term.year + 1}-01-01`,
            to: `${term.year + 1}-06-30`,
        },
    ];
    const inHalf = (section, half) =>
        (!section.starts_on || section.starts_on <= half.to) && (!section.ends_on || section.ends_on >= half.from);

    const terms = [];
    const split = [];
    for (const half of halves) {
        const own = sections.filter((section) => inHalf(section, half));
        if (own.length === 0) continue;
        // The half's dates are its usual section's, ignoring the ones that run all year.
        const single = own.filter(
            (section) =>
                section.starts_on && section.ends_on && section.starts_on >= half.from && section.ends_on <= half.to,
        );
        const startsOn = mostCommon(single.map((section) => section.starts_on)) ?? half.from;
        const endsOn = mostCommon(single.map((section) => section.ends_on)) ?? half.to;
        terms.push({
            code: half.code,
            name: half.name,
            season: half.season,
            year: half.year,
            starts_on: startsOn,
            ends_on: endsOn < startsOn ? startsOn : endsOn,
        });
        for (const section of own) {
            const meetings = section.meetings.filter((meeting) => overlaps(meeting, half.from, half.to));
            split.push({ ...section, term: half.code, meetings: meetings.length ? meetings : section.meetings });
        }
    }
    const splitExams = exams.flatMap((exam) => {
        const half = halves.find(
            (candidate) => exam.starts_at.slice(0, 10) >= candidate.from && exam.starts_at.slice(0, 10) <= candidate.to,
        );
        return half && terms.some((kept) => kept.code === half.code) ? [{ ...exam, term: half.code }] : [];
    });
    return { terms, sections: split, exams: splitExams };
}

/** @returns {Promise<import("../lib/import.js").Timetable>} */
export async function scrapeTimetable() {
    const timetable = await banner.scrapeTimetable();
    const terms = [];
    const sections = [];
    const exams = [];
    for (const term of timetable.terms) {
        const own = timetable.sections.filter((section) => section.term === term.code);
        const ownExams = (timetable.exams ?? []).filter((exam) => exam.term === term.code);
        if (term.season === "full_year") {
            const halves = splitAcademicYear(term, own, ownExams);
            terms.push(...halves.terms);
            sections.push(...halves.sections);
            exams.push(...halves.exams);
        } else {
            terms.push(term);
            sections.push(...own);
            exams.push(...ownExams);
        }
    }
    const kept = new Set(terms.filter((term) => term.ends_on >= cutoff()).map((term) => term.code));
    const keptSections = sections.filter((section) => kept.has(section.term));
    const usedCourses = new Set(keptSections.map((section) => section.course));
    for (const section of keptSections) {
        // "Distance" is StFX's schedule type for an online course, not a different kind of class.
        if (section.type === "Distance") section.kind = "lecture";
        section.instructors = section.instructors.map((instructor) => ({
            ...instructor,
            name: firstLast(instructor.name),
        }));
    }
    return {
        ...timetable,
        terms: terms.filter((term) => kept.has(term.code)),
        courses: timetable.courses.filter((course) => usedCourses.has(course.code)),
        sections: keptSections,
        exams: exams.filter((exam) => kept.has(exam.term)),
    };
}
