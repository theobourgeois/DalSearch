import { termCodes, type Term } from "./constants";
import { parseLocation } from "./location";
import { groupByType, sessionTypeLabel } from "./schedule";
import type { ClassSession, CourseListItem, Subject } from "./types";
import { joinWords } from "./utils";

export function offeredTerms(course: Pick<CourseListItem, "termClasses">): Term[] {
    const offered = new Set(course.termClasses.map((session) => session.term));
    return termCodes.filter((term) => offered.has(term));
}

/** The term a course page opens on: the current term if offered, else the next one, else the latest. */
export function defaultCourseTerm(offered: Term[], current: Term): Term {
    return offered.find((term) => term >= current) ?? offered.at(-1) ?? current;
}

/** The first term after `term` the course runs in. */
export function nextOfferedTerm(course: Pick<CourseListItem, "termClasses">, term: Term): Term | undefined {
    return offeredTerms(course).find((offered) => offered > term);
}

export function termSessions(course: Pick<CourseListItem, "termClasses">, term: Term): ClassSession[] {
    return course.termClasses.filter((session) => session.term === term);
}

/** "Lecture and lab", "Lecture, lab and tutorial". */
export function describeFormat(sessions: ClassSession[]): string {
    return joinWords(
        groupByType(sessions).map(([type], index) =>
            index === 0 ? sessionTypeLabel(type) : sessionTypeLabel(type).toLowerCase(),
        ),
    );
}

/** The campus most of a term's sessions are on. */
export function primaryCampus(sessions: ClassSession[]): string | null {
    return sessions.map((session) => parseLocation(session.location).campus).find(Boolean) ?? null;
}

const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
};

/** Course descriptions come from the Dal catalog as HTML with catalog-relative links; keep only the text. */
export function plainText(html: string): string {
    return html
        .replace(/<[^>]+>/g, "")
        .replace(/&[a-z#0-9]+;/gi, (entity) => entities[entity] ?? entity)
        .replace(/\s+/g, " ")
        .trim();
}

/** "(CSCI) Computer Science" -> "Computer Science". */
export function subjectName(subject: Subject): string {
    return subject.description.replace(/^\([A-Z]+\)\s*/, "");
}
