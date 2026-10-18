/**
 * Mount Royal University: the timetable and descriptions from its Banner 9 Self-Service class search
 * (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", spring: "06-30", summer: "08-31", fall: "12-31" };

/**
 * Mount Royal's terms are "Fall 2026 CREDIT", "Winter 2027 CREDIT", "Spring 2026 CREDIT" (May and
 * June) and "Summer 2026 CREDIT" (July and August).
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Winter|Spring|Summer)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    return { name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`, season, year: Number(match[2]) };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Winter|Spring|Summer)\s+(\d{4})/i);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://ban9ssb-prod.mtroyal.ca/StudentRegistrationSsb/ssb",
    includeTerm: ({ description }) => /\bCREDIT$/i.test(description) && !/non.?credit/i.test(description),
    describeTerm,
    roughEnd,
    // Online meetings are in an "Online Course" building; "In Person Sync & Online Async" sections have one
    // meeting in a room and one online.
    isOnline: (meeting, section) =>
        /^online/i.test(meeting.buildingDescription ?? "") ||
        (!meeting.building && /^(online|block week online)/i.test(section.instructionalMethodDescription ?? "")),
});
