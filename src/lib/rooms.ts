import { parseLocation } from "./location";
import { formatMinutes, isTimed, toMinutes, type CampusNow, type TimedSession } from "./time";
import type { ClassSession, CourseAndSubjectCode, Day } from "./types";

const DAY_START = 7 * 60;
const DAY_END = 22 * 60;
const MIN_FREE_MINUTES = 30;

/** "Right now" answers only make sense on a weekday while buildings are open. */
export function isCampusHours(now: CampusNow): boolean {
    return now.day !== null && now.day !== "S" && now.minutes >= DAY_START && now.minutes < DAY_END;
}

function meetingsOn(sessions: ClassSession[], day: Day): TimedSession[] {
    return sessions
        .filter(isTimed)
        .filter((session) => session.days.includes(day))
        .sort((a, b) => toMinutes(a.time.start) - toMinutes(b.time.start));
}

export type RoomStatus =
    { state: "busy"; session: TimedSession; until: number } | { state: "free"; until: number | null };

/** Whether a room is in use at a moment, and until when. */
export function roomStatus(sessions: ClassSession[], now: CampusNow): RoomStatus | null {
    if (!now.day) return null;
    const meetings = meetingsOn(sessions, now.day);
    const current = meetings.find((s) => toMinutes(s.time.start) <= now.minutes && toMinutes(s.time.end) > now.minutes);
    if (current) return { state: "busy", session: current, until: toMinutes(current.time.end) };
    const next = meetings.find((s) => toMinutes(s.time.start) > now.minutes);
    return { state: "free", until: next ? toMinutes(next.time.start) : null };
}

/** "Free until 14:35", or "Free for the rest of the day" when nothing else is booked. */
export function describeFreeUntil(until: number | null): string {
    return until ? `Free until ${formatMinutes(until)}` : "Free for the rest of the day";
}

/** Gaps of at least half an hour between `from` and 22:00 on a day. */
export function freeWindows(sessions: ClassSession[], day: Day, from: number): [number, number][] {
    const windows: [number, number][] = [];
    let cursor = from;
    for (const session of meetingsOn(sessions, day)) {
        const start = toMinutes(session.time.start);
        if (start - cursor >= MIN_FREE_MINUTES) windows.push([cursor, start]);
        cursor = Math.max(cursor, toMinutes(session.time.end));
    }
    if (DAY_END - cursor >= MIN_FREE_MINUTES) windows.push([cursor, DAY_END]);
    return windows;
}

export type FreeRoom = { room: string; until: number | null };

/** Rooms that are empty right now, preferring the same building and the longest free stretch. */
export function findFreeRooms(
    rooms: Map<string, ClassSession[]>,
    now: CampusNow,
    nearRoom?: string,
    limit = 5,
): FreeRoom[] {
    const building = nearRoom ? parseLocation(nearRoom).building : null;
    const free: (FreeRoom & { sameBuilding: boolean })[] = [];
    rooms.forEach((sessions, room) => {
        if (room === nearRoom) return;
        const status = roomStatus(sessions, now);
        if (status?.state !== "free") return;
        free.push({ room, until: status.until, sameBuilding: parseLocation(room).building === building });
    });
    return free
        .sort((a, b) => Number(b.sameBuilding) - Number(a.sameBuilding) || (b.until ?? DAY_END) - (a.until ?? DAY_END))
        .slice(0, limit)
        .map(({ room, until }) => ({ room, until }));
}

export type RoomBooking = {
    id: string;
    day: Day;
    start: number;
    end: number;
    courses: CourseAndSubjectCode[];
    sessions: ClassSession[];
};

/** A room's bookings, with cross-listed or double-booked sessions at the same time merged into one. */
export function roomBookings(sessions: ClassSession[]): RoomBooking[] {
    const bookings = new Map<string, RoomBooking>();
    for (const session of sessions.filter(isTimed)) {
        for (const day of session.days) {
            const start = toMinutes(session.time.start);
            const end = toMinutes(session.time.end);
            const id = `${day}-${start}-${end}`;
            const booking = bookings.get(id) ?? { id, day, start, end, courses: [], sessions: [] };
            if (!booking.courses.includes(session.course)) booking.courses.push(session.course);
            booking.sessions.push(session);
            bookings.set(id, booking);
        }
    }
    return [...bookings.values()];
}
