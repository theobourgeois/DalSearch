/**
 * University of Saskatchewan: the timetable and course descriptions from its Banner 9 Self-Service
 * class search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const lastDay = { fall: "12-31", winter: "04-30", spring: "06-30", summer: "08-31" };

/** "2026 Fall Term" -> {season, year}. */
function parse(description) {
    const match = description.match(/(\d{4})\s+(fall|winter|spring|summer)/i);
    return match ? { year: Number(match[1]), season: match[2].toLowerCase() } : null;
}

/** USask's terms are "2026 Fall Term", "2027 Winter Term", "2027 Spring Term" (May-June) and "2027 Summer Term" (July-August). */
function describeTerm({ description, starts_on }) {
    const term = parse(description);
    if (!term) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const label = term.season[0].toUpperCase() + term.season.slice(1);
    return { name: `${label} ${term.year}`, season: term.season, year: term.year };
}

function roughEnd({ description }) {
    const term = parse(description);
    return term ? `${term.year}-${lastDay[term.season]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://banner.usask.ca/StudentRegistrationSsb/ssb",
    // Keeps the July-August Summer term into November but drops the May-June Spring term by then.
    keepEndedDays: 90,
    describeTerm,
    roughEnd,
    isOnline: (meeting, section) =>
        /web\s?class|online/i.test(section.instructionalMethodDescription ?? "") ||
        (!meeting.building && /online/i.test(section.scheduleTypeDescription ?? "")),
});
