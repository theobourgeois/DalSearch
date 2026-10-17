import "server-only";

import { cache } from "react";
import { days as appDays, type Term } from "./constants";
import type { ExamSchedule } from "./exams";
import { summarizeRating, type RatingSummary } from "./instructors";
import { courseKey, sessionTypeOrder } from "./schedule";
import { publicClient } from "./supabase/public";
import { currentTermCode, dateIn, listedCodes, termIndex, type TermInfo } from "./terms";
import { UNIVERSITY_ID, UNIVERSITY_TIMEZONE } from "./university";
import type {
    ClassSession,
    Course,
    CourseAndSubjectCode,
    CourseCode,
    CourseListItem,
    CourseSummary,
    Day,
    Enrollment,
    InstructorListItem,
    InstructorRating,
    Room,
    Subject,
    SubjectCode,
    Time,
} from "./types";

/**
 * Server-only access to the course catalog in Supabase. The whole catalog for the university is read
 * at once (a few thousand courses), kept in memory for a few minutes, and pages pick what they need.
 * Client components receive trimmed props (CourseSummary, CourseListItem) rather than importing this.
 */

const PAGE_SIZE = 1000;
const FRESH_FOR_MS = 10 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 60 * 1000;
/** A meeting this short is a one-off (a makeup class, a room change for a day), not the weekly pattern. */
const MIN_RECURRING_DAYS = 14;

type MeetingRow = {
    days: string[];
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    starts_on: string | null;
    ends_on: string | null;
    /** Room ids. */
    rooms: string[];
};

type SectionRow = {
    term: Term;
    course: string;
    crn: string;
    section: string;
    type: string;
    kind: string;
    capacity: number | null;
    enrolled: number | null;
    meetings: MeetingRow[];
    instructors: { name: string; is_primary: boolean }[];
};

type CourseRow = {
    code: string;
    subject_code: string;
    number: string;
    title: string;
    credits: number | null;
    description: string | null;
};

type Catalog = {
    terms: TermInfo[];
    /** Listed term codes, oldest first. */
    listed: Term[];
    subjects: Subject[];
    courses: Course[];
    byCode: Map<string, Course>;
    ratings: Map<string, InstructorRating>;
    exams: ExamSchedule;
    rooms: Map<string, Room>;
    /** Per term, each room's sessions. */
    roomSessions: Map<Term, Map<string, ClassSession[]>>;
    derived: Map<string, unknown>;
};

/** A session and the rooms it's held in. */
type PlacedSession = { session: ClassSession; rooms: Set<string> };

/**
 * Every row of a query, a page at a time. `query` gets the range to read. Pages advance by what came
 * back, so a project whose API returns fewer rows per request than asked still reads everything.
 */
async function readAll<T>(
    query: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<T[]> {
    const rows: T[] = [];
    for (;;) {
        const { data, error } = await query(rows.length, rows.length + PAGE_SIZE - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) return rows;
        rows.push(...(data as T[]));
    }
}

/** "08:35:00" -> "0835". */
const toTime = (time: string) => time.slice(0, 2) + time.slice(3, 5);

const spanDays = (meeting: MeetingRow) =>
    meeting.starts_on && meeting.ends_on
        ? (Date.parse(meeting.ends_on) - Date.parse(meeting.starts_on)) / 86_400_000 + 1
        : Infinity;

/**
 * A section as the sessions the schedule works with. Meetings that only run for a few days are
 * dropped, meetings at the same time are merged (Mon and Wed at 8:35 are one session), and each
 * remaining weekly time becomes a session. Most sections have exactly one.
 */
function toSessions(row: SectionRow, rooms: Map<string, Room>): PlacedSession[] {
    const base = {
        term: row.term,
        section: row.section,
        type: row.type,
        crn: row.crn,
        course: row.course as CourseAndSubjectCode,
        instructors: row.instructors.map((instructor) => instructor.name),
    };
    if (row.meetings.length === 0) {
        const session: ClassSession = { ...base, days: [], time: { start: "C/D", end: "C/D" }, location: "", campus: null };
        return [{ session, rooms: new Set() }];
    }

    const recurring = row.meetings.filter((meeting) => spanDays(meeting) >= MIN_RECURRING_DAYS);
    const kept = recurring.length > 0 ? recurring : [[...row.meetings].sort((a, b) => spanDays(b) - spanDays(a))[0]];
    const timed = kept.filter((meeting) => meeting.start_time && meeting.end_time);
    const groups = new Map<string, MeetingRow[]>();
    for (const meeting of timed.length > 0 ? timed : kept) {
        const key = `${meeting.start_time}-${meeting.end_time}`;
        groups.set(key, [...(groups.get(key) ?? []), meeting]);
    }

    const placed = [...groups.values()].map((meetings): PlacedSession => {
        const [first] = meetings;
        const meetingDays = new Set(meetings.flatMap((meeting) => meeting.days));
        // A room booked for part of the term (a move after a few weeks) is still one of the section's rooms.
        const roomIds = new Set(meetings.flatMap((meeting) => meeting.rooms));
        const longest = [...meetings].sort((a, b) => spanDays(b) - spanDays(a)).find((meeting) => meeting.location);
        const mainRoom = longest?.rooms.map((id) => rooms.get(id)).find(Boolean);
        return {
            session: {
                ...base,
                days: appDays.filter((day) => meetingDays.has(day)) as Day[],
                time:
                    first.start_time && first.end_time
                        ? { start: toTime(first.start_time) as Time, end: toTime(first.end_time) as Time }
                        : { start: "C/D", end: "C/D" },
                location: longest?.location ?? "",
                campus: mainRoom?.campus ?? null,
            },
            rooms: roomIds,
        };
    });
    return mergeOverlapping(placed);
}

/**
 * Times of one section that overlap on the same days are one block in several rooms (a studio booked
 * 14:05-17:25 in one room and 14:35-17:25 in another), so they become a single session.
 */
function mergeOverlapping(placed: PlacedSession[]): PlacedSession[] {
    const merged: PlacedSession[] = [];
    for (const item of [...placed].sort((a, b) => a.session.time.start.localeCompare(b.session.time.start))) {
        const { session } = item;
        const block = merged.find(
            ({ session: other }) =>
                other.time.start !== "C/D" &&
                session.time.start !== "C/D" &&
                other.days.join() === session.days.join() &&
                session.time.start < other.time.end &&
                other.time.start < session.time.end,
        );
        if (!block) {
            merged.push(item);
            continue;
        }
        item.rooms.forEach((room) => block.rooms.add(room));
        if (session.time.end > block.session.time.end) {
            block.session.time = { start: block.session.time.start, end: session.time.end };
        }
    }
    return merged;
}

const typeRank = (type: string) =>
    sessionTypeOrder.includes(type) ? sessionTypeOrder.indexOf(type) : sessionTypeOrder.length;

function buildCourses(
    rows: CourseRow[],
    sectionRows: SectionRow[],
    prerequisites: Map<string, string[]>,
    listed: Term[],
    rooms: Map<string, Room>,
) {
    const sectionsByCourse = new Map<string, SectionRow[]>();
    for (const row of sectionRows) sectionsByCourse.set(row.course, [...(sectionsByCourse.get(row.course) ?? []), row]);
    const roomSessions = new Map<Term, Map<string, ClassSession[]>>();

    const courses = rows.map((row): Course => {
        const sections = (sectionsByCourse.get(row.code) ?? []).sort(
            (a, b) =>
                termIndex(listed, a.term) - termIndex(listed, b.term) ||
                typeRank(a.type) - typeRank(b.type) ||
                a.section.localeCompare(b.section, undefined, { numeric: true }) ||
                a.crn.localeCompare(b.crn),
        );

        const instructorsByTerm: Record<Term, string[]> = {};
        const enrollmentByTerm: Record<Term, Enrollment> = {};
        for (const term of listed) {
            const inTerm = sections.filter((section) => section.term === term);
            if (inTerm.length === 0) continue;
            // Primary instructors first, in section order.
            const people = [...inTerm.flatMap((section) => section.instructors)].sort(
                (a, b) => Number(b.is_primary) - Number(a.is_primary),
            );
            instructorsByTerm[term] = [...new Set(people.map((person) => person.name))];
            // Seats are counted over lectures, or the course's main kind of section when it has none, so a
            // lecture's seats aren't added to its labs'.
            const mainType = inTerm.some((section) => section.kind === "lecture") ? "lecture" : inTerm[0].kind;
            const counted = inTerm.filter((section) => section.kind === mainType);
            enrollmentByTerm[term] = {
                enrolled: counted.reduce((total, section) => total + (section.enrolled ?? 0), 0),
                capacity: counted.reduce((total, section) => total + (section.capacity ?? 0), 0),
            };
        }

        return {
            subjectCode: row.subject_code as SubjectCode,
            courseCode: row.number as CourseCode,
            title: row.title,
            creditHours: Number(row.credits ?? 0),
            description: row.description ?? "",
            prerequisites: (prerequisites.get(row.code) ?? []) as CourseAndSubjectCode[],
            termClasses: sections.flatMap((section) => {
                const placed = toSessions(section, rooms);
                for (const { session, rooms: roomIds } of placed) {
                    const byRoom = roomSessions.get(session.term) ?? new Map<string, ClassSession[]>();
                    roomIds.forEach((id) => byRoom.set(id, [...(byRoom.get(id) ?? []), session]));
                    roomSessions.set(session.term, byRoom);
                }
                return placed.map(({ session }) => session);
            }),
            enrollmentByTerm,
            instructorsByTerm,
        };
    });
    return { courses, roomSessions };
}

async function loadCatalog(): Promise<Catalog> {
    const db = publicClient();
    const university = UNIVERSITY_ID;

    const [termRows, subjectRows, courseRows, sectionRows, requisiteRows, ratingRows, examRows, roomRows] = await Promise.all([
        readAll<{ code: string; name: string; starts_on: string; ends_on: string; is_listed: boolean }>((from, to) =>
            db
                .from("terms")
                .select("code, name, starts_on, ends_on, is_listed")
                .eq("university_id", university)
                .order("starts_on")
                .order("code")
                .range(from, to),
        ),
        readAll<Subject>((from, to) =>
            db.from("subjects").select("code, name").eq("university_id", university).order("code").range(from, to),
        ),
        readAll<CourseRow>((from, to) =>
            db
                .from("catalog_courses")
                .select("code, subject_code, number, title, credits, description")
                .eq("university_id", university)
                .order("code")
                .range(from, to),
        ),
        readAll<SectionRow>((from, to) =>
            db
                .from("catalog_sections")
                .select("term, course, crn, section, type, kind, capacity, enrolled, meetings, instructors")
                .eq("university_id", university)
                .order("id")
                .range(from, to),
        ),
        readAll<{ course: string; required: string }>((from, to) =>
            db
                .from("course_requisite_codes")
                .select("course, required")
                .eq("university_id", university)
                .eq("kind", "prerequisite")
                .order("course")
                .order("required")
                .range(from, to),
        ),
        readAll<{
            match_name: string;
            first_name: string;
            last_name: string;
            profile_url: string | null;
            rating: number | null;
            difficulty: number | null;
            would_take_again: number | null;
            rating_count: number;
        }>((from, to) =>
            db
                .from("instructor_rating_by_name")
                .select("match_name, first_name, last_name, profile_url, rating, difficulty, would_take_again, rating_count")
                .eq("university_id", university)
                .order("match_name")
                .range(from, to),
        ),
        readAll<{ term: Term; course: string; section: string; starts_at: string }>((from, to) =>
            db
                .from("exam_schedule")
                .select("term, course, section, starts_at")
                .eq("university_id", university)
                .order("term")
                .order("course")
                .order("section")
                .range(from, to),
        ),
        readAll<{ id: string; campus: string | null; building: string; name: string }>((from, to) =>
            db
                .from("rooms")
                .select("id, campus, building, name")
                .eq("university_id", university)
                .order("id")
                .range(from, to),
        ),
    ]);

    const terms = termRows.map((row) => ({
        code: row.code,
        name: row.name,
        startsOn: row.starts_on,
        endsOn: row.ends_on,
        isListed: row.is_listed,
    }));
    const listed = listedCodes(terms);
    if (listed.length === 0) throw new Error(`No terms are listed for ${university}; run the data refresh`);

    // Only link to prerequisites that are on the timetable, so the links never lead to a missing page.
    const catalogCodes = new Set(courseRows.map((row) => row.code));
    const prerequisites = new Map<string, string[]>();
    for (const { course, required } of requisiteRows) {
        if (catalogCodes.has(required)) prerequisites.set(course, [...(prerequisites.get(course) ?? []), required]);
    }

    const rooms = new Map(roomRows.map((room) => [room.id, room]));
    const { courses, roomSessions } = buildCourses(courseRows, sectionRows, prerequisites, listed, rooms);
    const exams: ExamSchedule = {};
    for (const row of examRows) {
        const byCourse = (exams[row.term] ??= {});
        (byCourse[row.course] ??= []).push({ section: row.section, startsAt: row.starts_at });
    }

    return {
        terms,
        listed,
        subjects: subjectRows,
        courses,
        byCode: new Map(courses.map((course) => [courseKey(course), course])),
        ratings: new Map(
            ratingRows.map((row) => [
                row.match_name,
                {
                    firstName: row.first_name,
                    lastName: row.last_name,
                    profileUrl: row.profile_url,
                    rating: row.rating === null ? null : Number(row.rating),
                    difficulty: row.difficulty === null ? null : Number(row.difficulty),
                    wouldTakeAgain: row.would_take_again === null ? null : Number(row.would_take_again),
                    ratingCount: row.rating_count,
                },
            ]),
        ),
        exams,
        rooms,
        roomSessions,
        derived: new Map(),
    };
}

let snapshot: { catalog: Catalog; expiresAt: number } | null = null;
let loading: Promise<Catalog> | null = null;

/**
 * The catalog, reloaded every few minutes. If a reload fails the last good catalog keeps being served,
 * so a Supabase hiccup doesn't take the site down.
 */
function currentCatalog(): Promise<Catalog> {
    if (snapshot && Date.now() < snapshot.expiresAt) return Promise.resolve(snapshot.catalog);
    loading ??= loadCatalog()
        .then((catalog) => {
            snapshot = { catalog, expiresAt: Date.now() + FRESH_FOR_MS };
            return catalog;
        })
        .catch((error) => {
            if (!snapshot) throw error;
            console.error("Couldn't reload the catalog; serving the previous one", error);
            snapshot.expiresAt = Date.now() + RETRY_AFTER_FAILURE_MS;
            return snapshot.catalog;
        })
        .finally(() => {
            loading = null;
        });
    return loading;
}

const getCatalog = cache(currentCatalog);

/** Forgets the in-memory catalog so the next request reads Supabase again (after a data refresh). */
export function clearCatalog() {
    snapshot = null;
}

/** Computes something from the catalog once per catalog load. */
function derive<T>(catalog: Catalog, key: string, compute: () => T): T {
    if (!catalog.derived.has(key)) catalog.derived.set(key, compute());
    return catalog.derived.get(key) as T;
}

/** Every term the database knows, oldest first; `isListed` marks the ones on the timetable. */
export async function getTerms(): Promise<TermInfo[]> {
    return (await getCatalog()).terms;
}

/** The term running today (or the next one), decided on the server. */
export async function getCurrentTerm(): Promise<Term> {
    return currentTermCode(await getTerms(), dateIn(UNIVERSITY_TIMEZONE));
}

export async function getListedTerms(): Promise<Term[]> {
    return (await getCatalog()).listed;
}

export async function getSubjects(): Promise<Subject[]> {
    return (await getCatalog()).subjects;
}

/** Every course on the timetable. */
export async function getCourses(): Promise<Course[]> {
    return (await getCatalog()).courses;
}

export async function getCreditHourOptions(): Promise<number[]> {
    const catalog = await getCatalog();
    return derive(catalog, "creditHours", () =>
        [...new Set(catalog.courses.map((course) => course.creditHours))].sort((a, b) => a - b),
    );
}

export async function getCourse(code: string): Promise<Course | undefined> {
    return (await getCatalog()).byCode.get(code.toUpperCase());
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
    enrollmentByTerm,
    instructorsByTerm,
}: Course): CourseListItem {
    return { subjectCode, courseCode, title, creditHours, termClasses, enrollmentByTerm, instructorsByTerm };
}

export async function getCourseIndex(): Promise<CourseSummary[]> {
    const catalog = await getCatalog();
    return derive(catalog, "index", () => catalog.courses.map(toSummary));
}

export async function getCourseList(): Promise<CourseListItem[]> {
    const catalog = await getCatalog();
    return derive(catalog, "list", () => catalog.courses.map(toListItem));
}

/** Courses that list the given course as a prerequisite. */
export async function getUnlockedCourses(code: CourseAndSubjectCode): Promise<CourseSummary[]> {
    const catalog = await getCatalog();
    const unlocks = derive(catalog, "unlocks", () => {
        const map = new Map<string, CourseSummary[]>();
        for (const course of catalog.courses) {
            for (const prerequisite of course.prerequisites) {
                map.set(prerequisite, [...(map.get(prerequisite) ?? []), toSummary(course)]);
            }
        }
        return map;
    });
    return unlocks.get(code) ?? [];
}

/** RateMyProfessors summaries for the given timetable names. */
export async function getRatingSummaries(names: string[]): Promise<Record<string, RatingSummary>> {
    const { ratings } = await getCatalog();
    return Object.fromEntries(names.map((name) => [name, summarizeRating(name, ratings.get(name))]));
}

/** Overall RateMyProfessors rating by instructor name, for instructors who have one. */
export async function getRatingsByName(): Promise<Record<string, number>> {
    const catalog = await getCatalog();
    return derive(catalog, "ratingsByName", () =>
        Object.fromEntries(
            [...catalog.ratings]
                .filter(([, rating]) => rating.rating !== null && rating.rating > 0)
                .map(([name, rating]) => [name, rating.rating as number]),
        ),
    );
}

/** Distinct instructors across every term of a course. */
export function getCourseInstructors(course: Course): string[] {
    return [...new Set(Object.values(course.instructorsByTerm).flat())];
}

export async function getInstructorList(currentTerm: Term): Promise<InstructorListItem[]> {
    const catalog = await getCatalog();
    const coursesByName = new Map<string, Map<Term, Set<CourseAndSubjectCode>>>();
    for (const course of catalog.courses) {
        for (const [term, names] of Object.entries(course.instructorsByTerm)) {
            for (const name of names) {
                const byTerm = coursesByName.get(name) ?? new Map<Term, Set<CourseAndSubjectCode>>();
                byTerm.set(term, (byTerm.get(term) ?? new Set()).add(courseKey(course)));
                coursesByName.set(name, byTerm);
            }
        }
    }

    const fromNow = catalog.listed.slice(Math.max(termIndex(catalog.listed, currentTerm), 0));
    return [...coursesByName.entries()].map(([name, byTerm]) => {
        const all = new Set([...byTerm.values()].flatMap((codes) => [...codes]));
        const teachingTerm = fromNow.find((term) => byTerm.has(term));
        const subjectOf = (code: CourseAndSubjectCode) => catalog.byCode.get(code)?.subjectCode ?? code;
        return {
            ...summarizeRating(name, catalog.ratings.get(name)),
            subjects: [...new Set([...all].map(subjectOf))],
            teaching: teachingTerm ? { term: teachingTerm, courses: [...byTerm.get(teachingTerm)!] } : null,
            courseCount: all.size,
        };
    });
}

/** Final exams by term and course. */
export async function getExamSchedule(): Promise<ExamSchedule> {
    return (await getCatalog()).exams;
}

/** The rooms with timed classes in a term, each with those sessions. */
export async function getRoomSessions(term: Term): Promise<Map<string, ClassSession[]>> {
    const catalog = await getCatalog();
    return derive(catalog, `rooms:${term}`, () => {
        const rooms = new Map<string, ClassSession[]>();
        for (const [id, sessions] of catalog.roomSessions.get(term) ?? []) {
            const timed = sessions.filter((session) => session.time.start !== "C/D" && session.days.length > 0);
            if (timed.length > 0) rooms.set(id, timed);
        }
        return rooms;
    });
}

export async function getRooms(): Promise<Map<string, Room>> {
    return (await getCatalog()).rooms;
}
