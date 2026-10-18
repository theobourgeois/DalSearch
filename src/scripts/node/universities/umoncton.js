/**
 * Université de Moncton: the timetable and descriptions from its Banner 9 Self-Service class search
 * (see ../lib/banner9.js). Course titles and descriptions are in French.
 */
import { banner9 } from "../lib/banner9.js";

const seasons = {
    automne: ["fall", "Fall", "12-31"],
    hiver: ["winter", "Winter", "04-30"],
    "printemps-été": ["summer", "Spring-Summer", "08-31"],
};

/** "Automne 2026" -> the season, its English name and the year. */
function parse(description) {
    const match = description.match(/^(Automne|Hiver|Printemps-été)\s+(\d{4})/i);
    return match ? { season: seasons[match[1].toLowerCase()], year: Number(match[2]) } : null;
}

/**
 * Moncton's terms are "Automne 2026" (code 202620), "Hiver 2027" (202630) and "Printemps-été 2026"
 * (202610, May to August), named in English like the rest of the site.
 */
function describeTerm({ description, starts_on }) {
    const term = parse(description);
    if (!term) return { name: description, season: "other", year: Number(starts_on.slice(0, 4)) };
    return { name: `${term.season[1]} ${term.year}`, season: term.season[0], year: term.year };
}

function roughEnd({ description }) {
    const term = parse(description);
    return term ? `${term.year}-${term.season[2]}` : null;
}

export const { scrapeTimetable, scrapeCourseDetails } = banner9({
    baseUrl: "https://ls.socrate.umoncton.ca/StudentRegistrationSsb/ssb",
    describeTerm,
    roughEnd,
    // Distance and internet classes are in a building called "." ("À DISTANCE", "INTERNET").
    isOnline: (meeting) => meeting.building === ".",
});
