import "server-only";

import searchData from "../../database/search.json";
import instructorsData from "../../database/ratemyprofessor.json";
import subjectsData from "../../database/subjects.json";
import examData from "../../database/exam_schedule.json";
import { termCodeForDate, termCodes, termForDate, type Term } from "./constants";
import type { ExamSchedule } from "./exams";
import { cleanInstructorName, summarizeRating, type RatingSummary } from "./instructors";
import { courseKey } from "./schedule";
import type {
    ClassSession,
    Course,
    CourseAndSubjectCode,
    CourseByCode,
    CourseListItem,
    CourseSummary,
    ExamData,
    InstructorListItem,
    RateMyProfInstructorsByName,
    Subject,
} from "./types";

/**
 * Server-only access to the course database. The full dataset is several megabytes, so client
 * components receive trimmed props (CourseSummary, CourseListItem) instead of importing this file.
 */

/** The term running today, decided on the server. */
export function getCurrentTerm(): Term {
    return termForDate(new Date());
}

/** The scraped timetable has a few malformed sessions (null times or array locations); make them safe once. */
function normalizeSession(session: ClassSession): ClassSession {
    const time = session.time?.start ? session.time : { start: "C/D" as const, end: "C/D" as const };
    const location = typeof session.location === "string" ? session.location : "";
    return { ...session, time, location, days: session.days ?? [] };
}

/** Instructor lists hold raw names per section ("Staff", "Name (P)", trailing spaces); keep distinct real names. */
function normalizeInstructors(byTerm: Record<string, string[]>): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(byTerm ?? {}).map(([term, names]) => [
            term,
            [...new Set(names.map(cleanInstructorName).filter((name): name is string => name !== null))],
        ]),
    );
}

export const courses: CourseByCode = Object.fromEntries(
    Object.entries(searchData as unknown as CourseByCode).map(([code, course]) => [
        code,
        {
            ...course,
            termClasses: course.termClasses.map(normalizeSession),
            instructorsByTerm: normalizeInstructors(course.instructorsByTerm),
        },
    ]),
) as CourseByCode;

export const instructors = instructorsData as unknown as RateMyProfInstructorsByName;
export const subjects = subjectsData as Subject[];

const courseList = Object.values(courses);

export const creditHourOptions = [...new Set(courseList.map((course) => Number(course.creditHours)))].sort(
    (a, b) => a - b,
);

export function getCourse(code: string): Course | undefined {
    return courses[code.toUpperCase() as CourseAndSubjectCode];
}

function toSummary(course: Course): CourseSummary {
    return { code: courseKey(course), title: course.title, creditHours: course.creditHours };
}

export function toListItem({
    subjectCode,
    courseCode,
    title,
    creditHours,
    termClasses,
    enrollement,
    instructorsByTerm,
}: Course): CourseListItem {
    return { subjectCode, courseCode, title, creditHours, termClasses, enrollement, instructorsByTerm };
}

let courseIndex: CourseSummary[] | undefined;
export function getCourseIndex(): CourseSummary[] {
    courseIndex ??= courseList.map(toSummary);
    return courseIndex;
}

let listItems: CourseListItem[] | undefined;
export function getCourseList(): CourseListItem[] {
    listItems ??= courseList.map(toListItem);
    return listItems;
}

let unlocks: Map<string, CourseSummary[]> | undefined;
/** Courses that list the given course as a prerequisite. */
export function getUnlockedCourses(code: CourseAndSubjectCode): CourseSummary[] {
    if (!unlocks) {
        unlocks = new Map();
        for (const course of courseList) {
            for (const prerequisite of course.prerequisites) {
                unlocks.set(prerequisite, [...(unlocks.get(prerequisite) ?? []), toSummary(course)]);
            }
        }
    }
    return unlocks.get(code) ?? [];
}

export function getRatingSummary(name: string): RatingSummary {
    return summarizeRating(name, instructors[name]);
}

/** Overall RateMyProfessors rating by instructor name, for instructors who have one. */
export function getRatingsByName(): Record<string, number> {
    return Object.fromEntries(
        Object.entries(instructors)
            .map(([name, data]) => [name, Number(data.overallRating)] as const)
            .filter(([, rating]) => rating > 0),
    );
}

/** Distinct instructors across every term of a course. */
export function getCourseInstructors(course: Course): string[] {
    return [...new Set(Object.values(course.instructorsByTerm).flat())];
}

export function getInstructorList(currentTerm: Term): InstructorListItem[] {
    const coursesByName = new Map<string, Map<Term, Set<CourseAndSubjectCode>>>();
    for (const course of courseList) {
        for (const [term, names] of Object.entries(course.instructorsByTerm)) {
            for (const name of names) {
                const byTerm = coursesByName.get(name) ?? new Map<Term, Set<CourseAndSubjectCode>>();
                byTerm.set(term as Term, (byTerm.get(term as Term) ?? new Set()).add(courseKey(course)));
                coursesByName.set(name, byTerm);
            }
        }
    }

    return [...coursesByName.entries()].map(([name, byTerm]) => {
        const all = new Set([...byTerm.values()].flatMap((codes) => [...codes]));
        const teachingTerm = termCodes.find((term) => term >= currentTerm && byTerm.has(term));
        return {
            ...getRatingSummary(name),
            subjects: [...new Set([...all].map((code) => code.slice(0, 4)))],
            teaching: teachingTerm ? { term: teachingTerm, courses: [...byTerm.get(teachingTerm)!] } : null,
            courseCount: all.size,
        };
    });
}

/** Final exams, tagged with the term they belong to (worked out from the exam dates). */
export function getExamSchedule(): ExamSchedule {
    const exams = examData as Record<string, ExamData[]>;
    const firstDate = Object.values(exams).flat()[0]?.date;
    return { term: firstDate ? termCodeForDate(new Date(`${firstDate}T12:00:00`)) : "", exams };
}

const nonRooms = new Set(["Consult Department", "Online-ASYNCHRONOUS SESSION", "Online-SYNCHRONOUS SESSION"]);

const roomsByTerm = new Map<Term, Map<string, ClassSession[]>>();
/** Every physical room with the timed sessions held in it during a term. */
export function getRoomSessions(term: Term): Map<string, ClassSession[]> {
    let rooms = roomsByTerm.get(term);
    if (!rooms) {
        rooms = new Map();
        for (const course of courseList) {
            for (const session of course.termClasses) {
                if (session.term !== term || !session.location || nonRooms.has(session.location)) continue;
                if (session.time.start === "C/D" || session.days.length === 0) continue;
                rooms.set(session.location, [...(rooms.get(session.location) ?? []), session]);
            }
        }
        roomsByTerm.set(term, rooms);
    }
    return rooms;
}
