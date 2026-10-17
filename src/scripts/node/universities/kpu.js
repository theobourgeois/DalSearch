/**
 * Kwantlen Polytechnic University: the timetable, final exams and descriptions from its Banner 9
 * Self-Service class search (see ../lib/banner9.js).
 */
import { banner9 } from "../lib/banner9.js";

const ends = { spring: "04-30", summer: "08-31", fall: "12-31" };

/**
 * KPU has three terms a year, "Spring 2027" (Jan-Apr), "Summer 2026" and "Fall 2026", beside
 * year-long program intakes: "Apprenticeship 2026/27", "Trades Foundation 2026/27", "Study Abroad 2026/27".
 */
function describeTerm({ description, starts_on }) {
    const match = description.match(/^(Spring|Summer|Fall)\s+(\d{4})/i);
    if (match) {
        const season = match[1].toLowerCase();
        const year = Number(match[2]);
        return {
            name: `${season[0].toUpperCase()}${season.slice(1)} ${year}`,
            season,
            year,
        };
    }
    return { name: description, season: "full_year", year: Number(starts_on.slice(0, 4)) };
}

function roughEnd({ description }) {
    const term = description.match(/^(Spring|Summer|Fall)\s+(\d{4})/i);
    if (term) return `${term[2]}-${ends[term[1].toLowerCase()]}`;
    const programYear = description.match(/(\d{4})\/\d{2}/);
    return programYear ? `${Number(programYear[1]) + 1}-07-31` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://reg-prod.ec.kpu.ca/StudentRegistrationSsb/ssb",
    // Five terms a year are listed, three of them program intakes.
    recentTerms: 10,
    // The program intakes are trades and exchange cohorts, not terms students pick classes in.
    includeTerm: ({ description }) => /^(Spring|Summer|Fall)\s+\d{4}/i.test(description),
    describeTerm,
    roughEnd,
    isOnline: (meeting, section) =>
        /^online$/i.test(meeting.building ?? "") ||
        (!meeting.building && !/in-person/i.test(section.instructionalMethodDescription ?? "")),
});
