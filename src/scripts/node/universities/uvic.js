/**
 * University of Victoria: the timetable from its Banner 9 Self-Service class search (see
 * ../lib/banner9.js). Banner's course descriptions only say "see the Calendar", so there's no
 * scrapeCourseDetails; descriptions would have to come from UVic's Kuali calendar.
 */
import { banner9 } from "../lib/banner9.js";

const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "First Term: Sep - Dec 2026" -> the months it spans and the year. */
function monthRange(description) {
    const match = description.toLowerCase().match(/([a-z]{3})[a-z]*\s*-\s*([a-z]{3})[a-z]*\s+(\d{4})/);
    if (!match) return null;
    const [from, to] = [months.indexOf(match[1]), months.indexOf(match[2])];
    return from < 0 || to < 0 ? null : { from, to, year: Number(match[3]) };
}

/**
 * UVic's terms are "First Term: Sep - Dec 2026", "Second Term: Jan - Apr 2027" and "Summer Session:
 * May - Aug 2026". Students call January to April the Spring term, so it's named that.
 */
function describeTerm({ description, starts_on }) {
    const range = monthRange(description);
    const year = range?.year ?? Number(starts_on.slice(0, 4));
    const start = range?.from ?? Number(starts_on.slice(5, 7)) - 1;
    if (start >= 8) return { name: `Fall ${year}`, season: "fall", year };
    if (start <= 2) return { name: `Spring ${year}`, season: "winter", year };
    return { name: `Summer ${year}`, season: "summer", year };
}

/** The last day of the term's last month, from its name. */
function roughEnd({ description }) {
    const range = monthRange(description);
    return range ? new Date(Date.UTC(range.year, range.to + 1, 0)).toISOString().slice(0, 10) : null;
}

export const { scrapeTimetable } = banner9({
    baseUrl: "https://banner.uvic.ca/StudentRegistrationSsb/ssb",
    describeTerm,
    roughEnd,
    isOnline: (meeting, section) =>
        /fully online/i.test(section.instructionalMethodDescription ?? "") ||
        /^online$/i.test(section.campusDescription ?? ""),
});
