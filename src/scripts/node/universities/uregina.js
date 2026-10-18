/**
 * University of Regina: the timetable and descriptions from its Banner 9 Self-Service class search
 * (see ../lib/banner9.js), which answers on port 17043.
 */
import { banner9 } from "../lib/banner9.js";

const ends = { winter: "04-30", "spring/summer": "08-31", fall: "12-31" };

/**
 * Regina's terms are "2026 Fall", "2027 Winter" and "2026 Spring/Summer", each beside a Non-Credit
 * twin ("Non-Credit 2026 Fall") for continuing education.
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(\d{4})\s+(Fall|Winter|Spring\/Summer)$/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const label = match[2].replace(/\b\w/g, (letter) => letter.toUpperCase());
    const season = /spring/i.test(label) ? "summer" : label.toLowerCase();
    return { name: `${label} ${match[1]}`, season, year: Number(match[1]) };
}

function roughEnd({ description }) {
    const match = description.match(/(\d{4})\s+(Fall|Winter|Spring\/Summer)$/i);
    return match ? `${match[1]}-${ends[match[2].toLowerCase()]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://banner.uregina.ca:17043/StudentRegistrationSsb/ssb",
    // Every term is listed twice, once for credit and once for non-credit.
    recentTerms: 10,
    includeTerm: ({ description }) => !/non.?credit/i.test(description),
    describeTerm,
    roughEnd,
    // Online and remote sections have no building. Neither do many in-person classes without a room yet.
    isOnline: (meeting, section) =>
        !meeting.building &&
        /online|remote|live-?streamed/i.test(section.instructionalMethodDescription ?? ""),
});
