/**
 * University of Lethbridge: the timetable and descriptions from its Banner 9 Self-Service class search,
 * Bridge (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", spring: "04-30", summer: "08-31", fall: "12-31" };

/** Lethbridge's terms are "Fall 2026", "Winter 2027" and "Summer 2026" (May to August). */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Winter|Spring|Summer)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    return {
        name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`,
        season: season === "spring" ? "winter" : season,
        year: Number(match[2]),
    };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Winter|Spring|Summer)\s+(\d{4})/i);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://bridge.uleth.ca/StudentRegistrationSsb/ssb",
    describeTerm,
    roughEnd,
    // Online meetings are in an "Online" building, and online methods start "OL-" or "OA-". "IN-In Person"
    // sections without a room aren't online.
    isOnline: (meeting, section) =>
        /^online$/i.test(meeting.buildingDescription ?? "") ||
        (!meeting.building && /^O[LA]-/.test(section.instructionalMethodDescription ?? "")),
});
