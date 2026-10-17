import { findExam, type ExamSchedule } from "./exams";
import { campusDateTime, type IcsEvent } from "./ics";
import { formatCourseCode, sessionName } from "./schedule";
import type { TermInfo } from "./terms";
import { isTimed, type ClockTime, type TimedSession } from "./time";
import type { ClassSession, CourseAndSubjectCode, Day } from "./types";
import { joinWords } from "./utils";
import { universityPath, type University } from "./university";

/** How long an exam is shown for when its schedule only gives a start: the usual length of a final. */
const EXAM_MINUTES = 3 * 60;

const weekdayIndex: Record<Day, number> = { M: 1, T: 2, W: 3, R: 4, F: 5, S: 6 };

export type ScheduleCalendar = {
    university: Pick<University, "id" | "timezone">;
    sessions: ClassSession[];
    terms: TermInfo[];
    exams: ExamSchedule;
    /** The course's title, for event descriptions. */
    titleOf: (code: CourseAndSubjectCode) => string | undefined;
    /** The site's address, for links back to each course: "https://termly.ca". */
    origin: string;
};

/** "0835" -> "08:35" */
const clock = (time: ClockTime) => `${time.slice(0, 2)}:${time.slice(2, 4)}`;

/** The first day on or after `startsOn` ("2026-09-08") that the session meets. */
function firstMeeting(session: TimedSession, startsOn: string): string {
    const start = new Date(`${startsOn}T00:00:00Z`);
    const wait = Math.min(...session.days.map((day) => (weekdayIndex[day] - start.getUTCDay() + 7) % 7));
    return new Date(start.getTime() + wait * 86_400_000).toISOString().slice(0, 10);
}

/**
 * A schedule's classes as weekly events from the first to the last day of their term, and each course's
 * final exam. Sessions in terms the site doesn't know have no dates to place them on, so they're left out.
 */
export function scheduleEvents({ university, sessions, terms, exams, titleOf, origin }: ScheduleCalendar): IcsEvent[] {
    const { id, timezone: timeZone } = university;
    const termOf = new Map(terms.map((term) => [term.code, term]));
    const courseUrl = (code: string) => `${origin}${universityPath(id, `/${code}`)}`;

    const classes = sessions.filter(isTimed).flatMap((session): IcsEvent[] => {
        const term = termOf.get(session.term);
        if (!term) return [];
        const instructors = session.instructors?.length ? `Taught by ${joinWords(session.instructors)}` : undefined;
        return [
            {
                uid: `${id}-${session.term}-${session.crn}-${session.days.join("")}-${session.time.start}@termly`,
                summary: `${formatCourseCode(session.course)} ${sessionName(session)}`,
                timeZone,
                date: firstMeeting(session, term.startsOn),
                start: clock(session.time.start),
                end: clock(session.time.end),
                weekly: { days: session.days, until: term.endsOn },
                location: session.location,
                description: [titleOf(session.course), `CRN ${session.crn}`, instructors].filter(Boolean).join("\n"),
                url: courseUrl(session.course),
            },
        ];
    });

    const courses = new Map<string, ClassSession[]>();
    for (const session of sessions) {
        const key = `${session.term} ${session.course}`;
        courses.set(key, [...(courses.get(key) ?? []), session]);
    }
    const finals = [...courses.values()].flatMap((courseSessions): IcsEvent[] => {
        const { term, course } = courseSessions[0];
        const exam = findExam(exams[term]?.[course], courseSessions);
        const startsAt = exam && new Date(exam.startsAt);
        if (!startsAt || Number.isNaN(startsAt.getTime())) return [];
        const [date, start] = campusDateTime(startsAt, timeZone);
        const endsAt = exam.endsAt ? new Date(exam.endsAt) : null;
        const [, end] = campusDateTime(
            endsAt && endsAt > startsAt ? endsAt : new Date(startsAt.getTime() + EXAM_MINUTES * 60_000),
            timeZone,
        );
        return [
            {
                uid: `${id}-${term}-${course}-exam@termly`,
                summary: `${formatCourseCode(course)} final exam`,
                timeZone,
                date,
                start,
                end,
                location: exam.location ?? undefined,
                description: titleOf(course),
                url: courseUrl(course),
            },
        ];
    });

    return [...classes, ...finals];
}
