import "server-only";

import { SITE_NAME } from "./constants";
import { getCourse, getExamSchedule, getTerms } from "./data";
import { buildCalendar } from "./ics";
import { scheduleEvents } from "./schedule-calendar";
import { adminClient } from "./supabase/admin";
import type { ClassSession, Course } from "./types";
import { getUniversity } from "./university";

/** What the database gives out as a token: 64 hex characters. */
const TOKEN = /^[0-9a-f]{64}$/;

/**
 * Saved sessions with their section's times and rooms as the timetable has them now, so a room change
 * reaches the student's calendar. A section that's gone from the timetable keeps its saved copy.
 */
function current(saved: ClassSession[], courses: Map<string, Course | undefined>): ClassSession[] {
    const replaced = new Set<string>();
    return saved.flatMap((session) => {
        const key = `${session.term} ${session.crn}`;
        const fresh = courses
            .get(session.course)
            ?.termClasses.filter((other) => other.term === session.term && other.crn === session.crn);
        if (!fresh?.length) return [session];
        if (replaced.has(key)) return [];
        replaced.add(key);
        return fresh;
    });
}

/**
 * The iCalendar feed behind a student's calendar link: every term saved to their account, with classes
 * and final exams. Null when no account has this token, such as after the student resets their link.
 */
export async function buildCalendarFeed(token: string, origin: string): Promise<string | null> {
    if (!TOKEN.test(token)) return null;
    const db = adminClient();
    const { data: feed, error } = await db.from("calendar_feeds").select("user_id").eq("token", token).maybeSingle();
    if (error) throw error;
    if (!feed) return null;

    const { data: rows, error: schedulesError } = await db
        .from("schedules")
        .select("university_id, sessions")
        .eq("user_id", feed.user_id);
    if (schedulesError) throw schedulesError;

    const byUniversity = new Map<string, ClassSession[]>();
    for (const row of rows as { university_id: string; sessions: ClassSession[] }[]) {
        byUniversity.set(row.university_id, [...(byUniversity.get(row.university_id) ?? []), ...row.sessions]);
    }

    const events = await Promise.all(
        [...byUniversity].map(async ([id, saved]) => {
            const university = getUniversity(id);
            if (!university) return [];
            const codes = [...new Set(saved.map((session) => session.course))];
            const [terms, exams, ...found] = await Promise.all([
                getTerms(id),
                getExamSchedule(id),
                ...codes.map((code) => getCourse(id, code)),
            ]);
            const courses = new Map(codes.map((code, index) => [code, found[index] as Course | undefined]));
            return scheduleEvents({
                university,
                sessions: current(saved, courses),
                terms,
                exams,
                titleOf: (code) => courses.get(code)?.title,
                origin,
            });
        }),
    );

    return buildCalendar({ name: SITE_NAME, events: events.flat() });
}
