/** Client-safe constants. Nothing in this file may import from the course database. */

/** Terms in the timetable data, oldest first: "<academic year end><10 Fall | 20 Winter | 30 Summer>". */
export const termCodes = ["202620", "202630", "202710", "202720"] as const;

export type Term = (typeof termCodes)[number];

export const days = ["M", "T", "W", "R", "F", "S"] as const;

export const weekdays = ["M", "T", "W", "R", "F"] as const;

export const dayNames = {
    M: { short: "Mon", long: "Monday" },
    T: { short: "Tue", long: "Tuesday" },
    W: { short: "Wed", long: "Wednesday" },
    R: { short: "Thu", long: "Thursday" },
    F: { short: "Fri", long: "Friday" },
    S: { short: "Sat", long: "Saturday" },
} as const;

export const courseLevels = ["1000", "2000", "3000", "4000", "5000", "6000", "7000", "8000", "9000"];

export const scheduleBufferOptions = [0, 5, 10, 15, 30] as const;

const seasons = { "10": "Fall", "20": "Winter", "30": "Summer" } as const;

/** "202620" -> "Winter 2026", "202710" -> "Fall 2026". */
export function termLabel(term: string): string {
    const year = Number(term.slice(0, 4));
    const season = seasons[term.slice(4) as keyof typeof seasons];
    return `${season} ${season === "Fall" ? year - 1 : year}`;
}

/** Options for term pickers; `isDisabled` greys out terms that don't apply. */
export function termOptions(isDisabled?: (term: Term) => boolean) {
    return termCodes.map((term) => ({ value: term, label: termLabel(term), disabled: isDisabled?.(term) }));
}

/** The term code a date falls in: Sep-Dec is Fall, Jan-Apr Winter, May-Aug Summer. */
export function termCodeForDate(date: Date): string {
    const month = date.getMonth();
    const year = date.getFullYear();
    if (month >= 8) return `${year + 1}10`;
    return month <= 3 ? `${year}20` : `${year}30`;
}

/** The term running on a date, clamped to the terms the timetable covers. */
export function termForDate(date: Date): Term {
    const code = termCodeForDate(date);
    return termCodes.find((term) => term >= code) ?? termCodes[termCodes.length - 1];
}

export const links = {
    timetable: "https://self-service.dal.ca/BannerExtensibility/customPage/page/dal.stuweb_academicTimetable",
    source: "https://github.com/theobourgeois/DalSearch",
    coffee: "https://buymeacoffee.com/theobourgeois",
    theo: "https://theobourgeois.com",
    chris: "https://chrislangille.github.io/portfolio",
} as const;
