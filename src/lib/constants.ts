/** Client-safe constants. Nothing here may come from the database; terms are read through src/lib/terms.ts. */

/** A term code as the university writes it, e.g. Dal's "202710" for Fall 2026. Never compare or sort codes. */
export type Term = string;

export const SITE_NAME = "Termly";

export const SITE_URL = "https://termly.ca";

/** The site's old addresses; every page on them redirects to its place on SITE_URL. */
export const OLD_HOSTS = ["dalsearch.com", "www.dalsearch.com"];

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

export const scheduleBufferOptions = [0, 5, 10, 15, 30] as const;

export const links = {
    source: "https://github.com/theobourgeois/termly",
    coffee: "https://buymeacoffee.com/theobourgeois",
    theo: "https://theobourgeois.com",
    chris: "https://chrislangille.github.io/portfolio",
} as const;
