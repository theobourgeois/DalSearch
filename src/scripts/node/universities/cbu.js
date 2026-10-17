/**
 * Cape Breton University: Colleague Self-Service's public course catalog (see ../lib/colleague.js).
 * Terms are coded "2026F", "2027W" and "2026S" (spring and summer).
 */
import { colleague } from "../lib/colleague.js";

const seasons = { F: ["fall", "Fall"], W: ["winter", "Winter"], S: ["summer", "Spring/Summer"] };

/** "2026F" -> Fall 2026; anything else keeps CBU's description. */
function describeTerm(code, description, startsOn, endsOn) {
    const [, year, letter] = code.match(/^(\d{4})([A-Z]+)$/) ?? [];
    const [season, label] = seasons[letter] ?? ["other", description.replace(/^\d{4}\s+/, "").trim()];
    return {
        code,
        name: `${label} ${year ?? startsOn.slice(0, 4)}`,
        season,
        year: Number(startsOn.slice(0, 4)),
        starts_on: startsOn,
        ends_on: endsOn < startsOn ? startsOn : endsOn,
    };
}

export const { scrapeTimetable, scrapeCourseDetails } = colleague({
    baseUrl: "https://cbu-ss.colleague.elluciancloud.ca/Student",
    describeTerm,
});
