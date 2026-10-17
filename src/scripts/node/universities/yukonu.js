/**
 * Yukon University: the timetable, final exams and descriptions from its Banner 9 Self-Service class
 * search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const seasons = {
    fall: { season: "fall", end: "12-31" },
    winter: { season: "winter", end: "04-30" },
    "spring/summer": { season: "summer", end: "08-31" },
};

/**
 * Yukon's terms are "Fall 2026", "Winter 2027" and "Spring/Summer 2026", coded by academic year
 * (202601, 202602, 202503), beside a "Continuing Studies 2026" term for non-credit courses.
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Fall|Winter|Spring\/Summer)\s+(\d{4})/i);
    if (!match) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    const { season } = seasons[match[1].toLowerCase()];
    return {
        name: `${season[0].toUpperCase()}${season.slice(1)} ${match[2]}`,
        season,
        year: Number(match[2]),
    };
}

function roughEnd({ description }) {
    const match = description.match(/^(Fall|Winter|Spring\/Summer)\s+(\d{4})/i);
    if (match) return `${match[2]}-${seasons[match[1].toLowerCase()].end}`;
    const year = description.match(/continuing studies\s+(\d{4})/i);
    return year ? `${year[1]}-12-31` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://banner.yukonu.ca/StudentRegistrationSsb/ssb",
    // The class search stops listing a term once its registration closes (Fall 2026 by October), so
    // the terms come from the course catalog's list, which also has the terms open further ahead.
    termsFrom: "courseSearch",
    recentTerms: 8,
    includeTerm: ({ description }) => !/continuing studies/i.test(description),
    describeTerm,
    roughEnd,
    isOnline: (meeting, section) =>
        !meeting.building && !/face to face/i.test(section.instructionalMethodDescription ?? ""),
});
