/**
 * Capilano University: the timetable and descriptions from its Banner 9 Self-Service class search
 * (see ../lib/banner9.js), which answers on port 8443.
 */
import { banner9 } from "../lib/banner9.js";

const ends = { spring: "04-30", summer: "08-31", fall: "12-31" };

/** Capilano's terms are "Fall 2026", "Spring 2027" (January to April) and "Summer 2026". */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Spring|Summer)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    return {
        name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`,
        season: season === "spring" ? "winter" : season,
        year: Number(match[2]),
    };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Spring|Summer)\s+(\d{4})/i);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://ssb9s.capilanou.ca:8443/StudentRegistrationSsb/ssb",
    describeTerm,
    roughEnd,
    // Online meetings are in an "Online" building or on the Online campus. Hundreds of North Vancouver
    // sections have no building or time yet, and aren't online.
    isOnline: (meeting, section) =>
        /^online$/i.test(meeting.buildingDescription ?? "") || /^online$/i.test(section.campusDescription ?? ""),
});
