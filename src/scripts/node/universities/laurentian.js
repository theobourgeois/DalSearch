/**
 * Laurentian University: Colleague Self-Service's public course catalog (see ../lib/colleague.js).
 * Terms are coded "2026F", "2027W", "2026FW" (the full fall-winter year) and, for spring and
 * summer, "2026SP" (the whole spring session), "2026SF"/"2026SS" (its halves) and "2026SU".
 */
import { colleague } from "../lib/colleague.js";

const seasons = {
    F: ["fall", "Fall"],
    W: ["winter", "Winter"],
    FW: ["full_year", "Fall-Winter"],
    SP: ["spring", "Spring"],
    SF: ["spring", "Spring I"],
    SS: ["spring", "Spring II"],
    SU: ["summer", "Summer"],
};

/** "2026F" -> Fall 2026, "2026FW" -> Fall-Winter 2026-27; anything else keeps Laurentian's description. */
function describeTerm(code, description, startsOn, endsOn) {
    const [, year, suffix] = code.match(/^(\d{4})([A-Z]+)$/) ?? [];
    const [season, label] = seasons[suffix] ?? ["other", description.replace(/^\d{4}\s+/, "").trim()];
    const years = season === "full_year" ? `${year}-${String(Number(year) + 1).slice(2)}` : year;
    return {
        code,
        name: `${label} ${years ?? startsOn.slice(0, 4)}`,
        season,
        year: Number(startsOn.slice(0, 4)),
        starts_on: startsOn,
        ends_on: endsOn < startsOn ? startsOn : endsOn,
    };
}

export const { scrapeTimetable, scrapeCourseDetails } = colleague({
    baseUrl: "https://selfservice.laurentian.ca/Student",
    describeTerm,
});
