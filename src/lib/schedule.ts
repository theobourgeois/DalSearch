import { isTimed, toMinutes, type TimedSession } from "./time";
import { joinWords } from "./utils";
import type { ClassSession, CourseAndSubjectCode, CourseListItem, Day, SessionType, Term } from "./types";

export const sessionTypeOrder = ["Lec", "Lab", "Tut"];

const sessionTypeLabels: Record<string, string> = {
    Lec: "Lecture",
    Lab: "Lab",
    Tut: "Tutorial",
    Sem: "Seminar",
    Prac: "Practicum",
    Std: "Studio",
    Ind: "Independent study",
    Fld: "Field work",
    Ths: "Thesis",
    WkT: "Work term",
    WkS: "Workshop",
    Int: "Internship",
    Aud: "Audit",
    Ens: "Ensemble",
};

/** "Lec" -> "Lecture"; unknown types are shown as they appear in the timetable. */
export function sessionTypeLabel(type: SessionType): string {
    return sessionTypeLabels[type] ?? type;
}

/**
 * A course number's level, from its first digit and how many digits it has: "2110" -> "2000" at Dal,
 * "270" -> "200" at USask, "1105EL" -> "1000".
 */
export function courseLevel(number: string): string | null {
    const digits = number.match(/^\d+/)?.[0];
    // Numbers starting with 0 ("060L") are upgrading or non-credit courses, below any level.
    return digits && digits.length >= 3 && digits[0] !== "0" ? digits[0] + "0".repeat(digits.length - 1) : null;
}

export function courseKey(course: Pick<CourseListItem, "subjectCode" | "courseCode">): CourseAndSubjectCode {
    return `${course.subjectCode}${course.courseCode}` as CourseAndSubjectCode;
}

/** "CSCI2122" -> "CSCI 2122". */
export function formatCourseCode(code: string): string {
    // The subject is the letters before the number: "CSCI2110" -> "CSCI 2110", "ENG110" -> "ENG 110",
    // and Yukon's "2DS101" -> "2DS 101". Codes without a number are left as they are.
    return code.replace(/^(\d*[A-Z]+)(?=\d)/, "$1 ");
}

/** "Lec 01", "Lab B03". */
export function sessionName(session: Pick<ClassSession, "type" | "section">): string {
    return `${session.type} ${session.section}`;
}

/** ["Lec 01", "Lab B03"] -> "Lec 01 and Lab B03". */
export function listSessions(sessions: Pick<ClassSession, "type" | "section">[]): string {
    return joinWords(sessions.map(sessionName));
}

function sessionsConflict(first: ClassSession, second: ClassSession, bufferMinutes = 0): boolean {
    if (first.crn === second.crn || first.term !== second.term) return false;
    if (!isTimed(first) || !isTimed(second)) return false;
    if (!first.days.some((day) => second.days.includes(day))) return false;

    return (
        toMinutes(first.time.start) < toMinutes(second.time.end) + bufferMinutes &&
        toMinutes(first.time.end) > toMinutes(second.time.start) - bufferMinutes
    );
}

export function findClashes(candidate: ClassSession, scheduled: ClassSession[], bufferMinutes = 0): ClassSession[] {
    return scheduled.filter((session) => sessionsConflict(candidate, session, bufferMinutes));
}

function sessionFits(candidate: ClassSession, scheduled: ClassSession[], bufferMinutes = 0): boolean {
    return findClashes(candidate, scheduled, bufferMinutes).length === 0;
}

/** Groups a course's sessions by type (lectures, labs, tutorials, then any others), keeping their order within a type. */
export function groupByType(sessions: ClassSession[]): [SessionType, ClassSession[]][] {
    const rank = (type: string) =>
        sessionTypeOrder.includes(type) ? sessionTypeOrder.indexOf(type) : sessionTypeOrder.length;
    const types = [...new Set(sessions.map((session) => session.type))].sort((a, b) => rank(a) - rank(b));
    return types.map((type) => [type, sessions.filter((session) => session.type === type)]);
}

export type CourseFit =
    | { status: "scheduled"; sessions: ClassSession[] }
    | { status: "fits"; picks: ClassSession[] }
    | { status: "clash"; type: SessionType; clashesWith: CourseAndSubjectCode; onlyOption: boolean }
    | { status: "unavailable" };

/**
 * Works out whether a course can be added to a schedule in a term: one section of every type (lecture,
 * lab, tutorial) has to fit around the sessions already scheduled.
 */
export function getCourseFit(
    course: CourseListItem,
    term: Term,
    scheduled: ClassSession[],
    bufferMinutes = 0,
): CourseFit {
    const key = courseKey(course);
    const inTerm = scheduled.filter((session) => session.term === term);
    const own = inTerm.filter((session) => session.course === key);
    if (own.length > 0) return { status: "scheduled", sessions: own };

    const offered = course.termClasses.filter((session) => session.term === term);
    if (offered.length === 0) return { status: "unavailable" };

    // A section can meet at more than one weekly time, so the options are sections (CRNs): one fits
    // only if all of its sessions do, and picking it adds all of them.
    const picks: ClassSession[] = [];
    for (const [type, sessions] of groupByType(offered)) {
        const taken = [...inTerm, ...picks];
        const options = [...new Set(sessions.map((session) => session.crn))].map((crn) =>
            sessions.filter((session) => session.crn === crn),
        );
        const fitting = options.filter((option) =>
            option.every((session) => sessionFits(session, taken, bufferMinutes)),
        );
        const pick = fitting.find((option) => option.some(isTimed)) ?? fitting[0];
        if (!pick) {
            const [clash] = sessions.flatMap((session) => findClashes(session, taken, bufferMinutes));
            return { status: "clash", type, clashesWith: clash.course, onlyOption: options.length === 1 };
        }
        picks.push(...pick);
    }
    return { status: "fits", picks };
}

export type ScheduleConflict = {
    first: TimedSession;
    second: TimedSession;
    days: Day[];
    start: number;
    end: number;
};

/** Every pair of overlapping sessions in a schedule, with the shared days and overlapping window. */
export function findConflicts(sessions: ClassSession[]): ScheduleConflict[] {
    const timed = sessions.filter(isTimed);
    const conflicts: ScheduleConflict[] = [];
    timed.forEach((first, index) => {
        for (const second of timed.slice(index + 1)) {
            if (!sessionsConflict(first, second)) continue;
            conflicts.push({
                first,
                second,
                days: first.days.filter((day) => second.days.includes(day)),
                start: Math.max(toMinutes(first.time.start), toMinutes(second.time.start)),
                end: Math.min(toMinutes(first.time.end), toMinutes(second.time.end)),
            });
        }
    });
    return conflicts;
}

/** When the week starts earliest, and the day with the most classes. */
export function weekShape(sessions: ClassSession[]) {
    const timed = sessions.filter(isTimed);
    if (timed.length === 0) return null;

    const earliest = Math.min(...timed.map((session) => toMinutes(session.time.start)));
    const earliestDays = [...new Set(timed.filter((s) => toMinutes(s.time.start) === earliest).flatMap((s) => s.days))];
    const counts = new Map<Day, number>();
    timed.forEach((session) => session.days.forEach((day) => counts.set(day, (counts.get(day) ?? 0) + 1)));
    const [busiestDay, busiestCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

    return { earliest, earliestDays, busiestDay, busiestCount, classesPerDay: counts };
}

/** Total credit hours of the distinct courses in a list of sessions. */
export function totalCredits(
    sessions: ClassSession[],
    creditsOf: (code: CourseAndSubjectCode) => number | undefined,
): number {
    return scheduledCourses(sessions).reduce((total, code) => total + (creditsOf(code) ?? 0), 0);
}

/** Unique course codes in the order they were first added. */
export function scheduledCourses(sessions: ClassSession[]): CourseAndSubjectCode[] {
    return [...new Set(sessions.map((session) => session.course))];
}
