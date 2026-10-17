/**
 * Memorial University of Newfoundland: the timetable and course descriptions from its Banner 9
 * Self-Service class search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

/** "2026-2027 Fall" or "2025-2026 Winter (View Only)" -> the academic year's two calendar years and the semester. */
function parse(description) {
    const match = description.replace(/\(view only\)/i, "").match(/^(\d{4})-(\d{4})\s+(.+)$/);
    return match ? { first: Number(match[1]), second: Number(match[2]), semester: match[3].trim() } : null;
}

/**
 * Memorial names terms by academic year: "2026-2027 Fall", "2026-2027 Winter", "2026-2027 Spring"
 * (May to August), "2026-2027 MI Summer" (the Marine Institute's) and "2026-2027 Medicine" (the MD
 * program's year).
 */
function describeTerm({ description, starts_on }) {
    const term = parse(description);
    if (!term) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const { first, second, semester } = term;
    if (/^fall$/i.test(semester)) return { name: `Fall ${first}`, season: "fall", year: first };
    if (/^winter$/i.test(semester)) return { name: `Winter ${second}`, season: "winter", year: second };
    if (/^spring$/i.test(semester)) return { name: `Spring ${second}`, season: "summer", year: second };
    if (/summer/i.test(semester))
        return { name: `Summer ${second} (Marine Institute)`, season: "summer", year: second };
    if (/medicine/i.test(semester)) return { name: `Medicine ${first}-${second}`, season: "full_year", year: first };
    return { name: `${semester} ${first}-${second}`, season: "other", year: first };
}

function roughEnd({ description }) {
    const term = parse(description);
    if (!term) return null;
    const { first, second, semester } = term;
    if (/^fall$/i.test(semester)) return `${first}-12-31`;
    if (/^winter$/i.test(semester)) return `${second}-04-30`;
    if (/^spring$/i.test(semester)) return `${second}-08-31`;
    if (/summer/i.test(semester)) return `${second}-09-30`;
    if (/medicine/i.test(semester)) return `${second}-06-30`;
    return null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://self-service.mun.ca/StudentRegistrationSsb/ssb",
    // Drops last year's Medicine term (it ends in June) while keeping the Spring semester into November.
    keepEndedDays: 90,
    describeTerm,
    roughEnd,
    // Many in-person classes have no room yet; only Online and Remote sections are online.
    isOnline: (meeting, section) =>
        /online|remote/i.test(section.instructionalMethodDescription ?? "") ||
        /^online$/i.test(section.campusDescription ?? ""),
});
