/**
 * Thompson Rivers University: the timetable and descriptions from its Banner 9 Self-Service class
 * search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", summer: "08-31", fall: "12-31" };

/**
 * TRU's terms are "Fall 2026 (Sep-Dec)", "Winter 2027 (Jan-Apr)" and "Summer 2026 (May-Aug)". Open
 * Learning's self-paced courses have terms of their own: "Fall 2026 OL Division".
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Winter|Summer)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    const name = `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`;
    return {
        name: /\bOL\b/.test(description) ? `${name} (Open Learning)` : name,
        season,
        year: Number(match[2]),
    };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Winter|Summer)\s+(\d{4})/i);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://reg-prod.ec.tru.ca/StudentRegistrationSsb/ssb",
    recentTerms: 8,
    // Open Learning lists the same ~330 self-paced courses every term, with no class times.
    includeTerm: ({ description }) => !/\bOL Division\b/i.test(description),
    describeTerm,
    roughEnd,
    // Online meetings are in a "Virtual Delivery" building.
    isOnline: (meeting, section) =>
        /virtual/i.test(meeting.buildingDescription ?? "") ||
        (!meeting.building && !/classroom/i.test(section.instructionalMethodDescription ?? "")),
    // "Torts (3,0,0)(3,0,0)", "Clinical Practice 4 (0,0,48P)": the hours of lecture, seminar, lab and
    // practicum a week, sometimes twice, and (L) on courses with labs.
    cleanTitle: (title) =>
        title
            .replace(/\(\s*\d+(\.\d+)?[A-Z*]*(\s*,\s*\d+(\.\d+)?[A-Z*]*){2,3}\s*\)|\([A-Z]\)/g, " ")
            .replace(/\s+or\s*$/, "")
            .replace(/\s+/g, " ")
            .trim(),
});
