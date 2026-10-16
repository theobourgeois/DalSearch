import { cleanInstructorName } from "./instructors";

export type GradingComponent = {
    name: string;
    /** Percent of the final grade. */
    weight: number | null;
    count: number | null;
    note: string | null;
};

export type GradingScheme = { label: string | null; components: GradingComponent[] };

export type Textbook = { title: string; authors: string | null; required: boolean | null; free: boolean | null };

/** What a public syllabus says, pulled out of the PDF by src/scripts/py/syllabi.py. */
export type Syllabus = {
    id: string;
    source_url: string;
    /** The PDF is gone from dal.ca and only the Wayback Machine has it. */
    archived: boolean;
    course_codes: string[];
    term_season: "Fall" | "Winter" | "Summer" | "Full year" | null;
    term_year: number;
    instructors: string[];
    grading_schemes: GradingScheme[];
    weights_add_up: boolean;
    textbooks: Textbook[];
    policies: { topic: string; summary: string }[];
    weekly_topics: { when: string; topic: string }[];
};

export const SYLLABUS_COLUMNS =
    "id, source_url, archived, course_codes, term_season, term_year, instructors, grading_schemes, weights_add_up, textbooks, policies, weekly_topics";

const seasonOrder = { Winter: 1, Summer: 2, Fall: 3, "Full year": 3 } as const;

/** Sorts later terms higher. */
export function syllabusTermOrder(syllabus: Syllabus): number {
    return syllabus.term_year * 10 + (syllabus.term_season ? seasonOrder[syllabus.term_season] : 0);
}

/** "Winter 2025", or "2025" when the syllabus doesn't name the term. */
export function syllabusTerm(syllabus: Syllabus): string {
    return syllabus.term_season ? `${syllabus.term_season} ${syllabus.term_year}` : String(syllabus.term_year);
}

/** The PDF itself, or the Wayback Machine's copy once dal.ca has removed it. */
export function syllabusUrl(syllabus: Syllabus): string {
    return syllabus.archived ? `https://web.archive.org/web/2026/${syllabus.source_url}` : syllabus.source_url;
}

const simplify = (name: string) =>
    name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/**
 * Whether a timetable name ("Kalyaniwalla N.") and a full name from a syllabus ("Nauzer Kalyaniwalla")
 * are the same person, going by surname.
 */
export function isSameInstructor(timetableName: string, fullName: string): boolean {
    const cleaned = cleanInstructorName(timetableName);
    if (!cleaned) return false;
    const surname = simplify(cleaned.replace(/\s+[A-Za-z]\.?$/, ""));
    const full = simplify(fullName);
    return surname.length > 1 && (full === surname || full.endsWith(` ${surname}`));
}

/** The best syllabus to show first: one from someone teaching `termInstructors`, then the most recent. */
export function preferredSyllabus(syllabi: Syllabus[], termInstructors: string[]): Syllabus | undefined {
    return syllabi.find((syllabus) => teachesFrom(syllabus, termInstructors)) ?? syllabi[0];
}

export function teachesFrom(syllabus: Syllabus, termInstructors: string[]): boolean {
    return syllabus.instructors.some((name) => termInstructors.some((current) => isSameInstructor(current, name)));
}

/** "20%", "2.5%". */
export function formatWeight(weight: number): string {
    return `${Number.isInteger(weight) ? weight : weight.toFixed(1)}%`;
}
