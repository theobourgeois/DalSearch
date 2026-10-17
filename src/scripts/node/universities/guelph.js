/**
 * University of Guelph: Colleague Self-Service's public course catalog (see ../lib/colleague.js).
 * Terms are coded "F26", "W27" and "S26".
 */
import { colleague } from "../lib/colleague.js";

const seasons = { F: ["fall", "Fall"], W: ["winter", "Winter"], S: ["summer", "Summer"] };

/** "F26" -> Fall 2026; anything else keeps Guelph's description. */
function describeTerm(code, description, startsOn, endsOn) {
    const [, letter, year] = code.match(/^([A-Z])(\d{2})$/) ?? [];
    const [season, label] = seasons[letter] ?? ["other", description.replace(/\s*\d{4}\s*/, " ").trim()];
    return {
        code,
        name: `${label} ${year ? `20${year}` : startsOn.slice(0, 4)}`,
        season,
        year: Number(startsOn.slice(0, 4)),
        starts_on: startsOn,
        ends_on: endsOn < startsOn ? startsOn : endsOn,
    };
}

export const { scrapeTimetable, scrapeCourseDetails } = colleague({
    baseUrl: "https://colleague-ss.uoguelph.ca/Student",
    describeTerm,
});
