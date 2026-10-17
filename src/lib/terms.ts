import type { Term } from "./constants";

/** A term from the database. Terms are ordered by their dates, never by code, since codes differ between universities. */
export type TermInfo = {
    code: Term;
    /** "Fall 2026" */
    name: string;
    /** "2026-09-08" */
    startsOn: string;
    endsOn: string;
    /** On the timetable right now. Only listed terms can be picked; older ones are kept to label old schedules. */
    isListed: boolean;
};

/** The listed terms' codes, oldest first. `terms` is already in date order. */
export function listedCodes(terms: TermInfo[]): Term[] {
    return terms.filter((term) => term.isListed).map((term) => term.code);
}

/** "Fall 2026"; falls back to the code for a term the database doesn't know. */
export function termLabel(terms: TermInfo[], code: Term): string {
    return terms.find((term) => term.code === code)?.name ?? code;
}

const length = (term: TermInfo) => Date.parse(term.endsOn) - Date.parse(term.startsOn);

/**
 * The term in progress on `today` ("2026-10-16" in the university's timezone), or else the next one to
 * start, or else the latest. Between terms this is the upcoming one, which is the one students plan.
 * When several are running, the shortest wins: Fall 2026 over MUN's year-long Medicine term.
 */
export function currentTermCode(terms: TermInfo[], today: string): Term {
    const listed = terms.filter((term) => term.isListed);
    const running = listed
        .filter((term) => term.startsOn <= today && today <= term.endsOn)
        .sort((a, b) => length(a) - length(b))[0];
    return (running ?? listed.find((term) => term.startsOn > today) ?? listed.at(-1))?.code ?? "";
}

/** Today's date in `timeZone`, as "2026-10-16". */
export function dateIn(timeZone: string, date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Position of a term in date order, so terms can be compared without reading their codes. */
export function termIndex(codes: readonly Term[], code: Term): number {
    return codes.indexOf(code);
}
