/**
 * University of the Fraser Valley: the timetable and descriptions from its Banner 9 Self-Service class
 * search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", summer: "08-31", fall: "12-31" };
const REGULAR = /^(Fall|Winter|Summer)\s+(\d{4})$/i;

/**
 * UFV's terms are "Fall 2026", "Winter 2027" and "Summer 2026", beside continuing education ("Continuing
 * Ed Sep-Dec 2026") and year-long trades intakes ("Trades 2026-2027").
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(REGULAR);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const season = match[1].toLowerCase();
    return { name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`, season, year: Number(match[2]) };
}

function roughEnd({ description }) {
    const match = description.match(REGULAR);
    return match ? `${match[2]}-${ends[match[1].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://apps.ban.ufv.ca/StudentRegistrationSsb/ssb",
    // Four terms a year are listed, two of them continuing education and trades.
    recentTerms: 10,
    includeTerm: ({ description }) => REGULAR.test(description),
    describeTerm,
    roughEnd,
    // Online meetings are in an "Online" building on the "Online: UFV" campus.
    isOnline: (meeting, section) =>
        /^online/i.test(`${meeting.buildingDescription ?? ""}`) || /^online/i.test(section.campusDescription ?? ""),
});
