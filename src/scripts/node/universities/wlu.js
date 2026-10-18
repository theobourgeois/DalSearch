/**
 * Wilfrid Laurier University: the timetable and descriptions from its Banner 9 Self-Service class
 * search, LORIS (see ../lib/banner9.js). It lives at /register/ssb rather than the usual path.
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", spring: "08-31", fall: "12-31" };

/** Laurier's terms are "Fall 2026", "Winter 2027" and "Spring 2027", which runs May to August. */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Winter|Spring)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    return {
        name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`,
        season: season === "spring" ? "summer" : season,
        year: Number(match[2]),
    };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Winter|Spring)\s+(\d{4})/i);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://loris.wlu.ca/register/ssb",
    describeTerm,
    roughEnd,
    // Online sections are on the Virtual campus or in a VIRTUAL building. Classes with no room yet are
    // listed without a building, so that alone doesn't make them online.
    isOnline: (meeting, section) =>
        /virtual/i.test(`${meeting.buildingDescription ?? ""} ${section.campusDescription ?? ""}`) ||
        /online/i.test(section.instructionalMethodDescription ?? ""),
});
