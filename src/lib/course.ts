import type { Term } from "./constants";
import { groupByType, sessionTypeLabel } from "./schedule";
import { termIndex } from "./terms";
import type { ClassSession, CourseListItem } from "./types";
import { joinWords } from "./utils";

/** The listed terms (`listed`, oldest first) the course runs in. */
export function offeredTerms(course: Pick<CourseListItem, "termClasses">, listed: readonly Term[]): Term[] {
    const offered = new Set(course.termClasses.map((session) => session.term));
    return listed.filter((term) => offered.has(term));
}

/** The term a course page opens on: the current term if offered, else the next one, else the latest. */
export function defaultCourseTerm(offered: Term[], current: Term, listed: readonly Term[]): Term {
    const now = termIndex(listed, current);
    return offered.find((term) => termIndex(listed, term) >= now) ?? offered.at(-1) ?? current;
}

/** The first term after `term` the course runs in. */
export function nextOfferedTerm(
    course: Pick<CourseListItem, "termClasses">,
    term: Term,
    listed: readonly Term[],
): Term | undefined {
    const after = termIndex(listed, term);
    return offeredTerms(course, listed).find((offered) => termIndex(listed, offered) > after);
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

/** The campus of a term's first session that has one. */
export function primaryCampus(sessions: ClassSession[]): string | null {
    return sessions.map((session) => session.campus).find(Boolean) ?? null;
}
