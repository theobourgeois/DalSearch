import { dayNames, days } from "./constants";
import type { ClassSession, Day, Time } from "./types";

export type ClockTime = Exclude<Time, "C/D">;

/** A class session that meets at a fixed time on at least one day. */
export type TimedSession = ClassSession & { time: { start: ClockTime; end: ClockTime } };

export function isTimed(session: ClassSession): session is TimedSession {
    const { start, end } = session.time ?? {};
    return !!start && !!end && start !== "C/D" && end !== "C/D" && session.days?.length > 0;
}

/** "1135" -> 695 (minutes after midnight). */
export function toMinutes(time: ClockTime): number {
    return Number(time.slice(0, 2)) * 60 + Number(time.slice(2, 4));
}

/** 695 -> "11:35". */
export function formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
}

/** "0835" -> "8:35". */
function formatTime(time: ClockTime): string {
    return formatMinutes(toMinutes(time));
}

export function formatTimeRange(session: TimedSession): string {
    return `${formatTime(session.time.start)}-${formatTime(session.time.end)}`;
}

/** ["M", "W"] -> "Mon, Wed". */
export function formatDays(sessionDays: readonly Day[]): string {
    return sessionDays.map((day) => dayNames[day].short).join(", ");
}

/** 910 -> "15h 10m", 65 -> "1h 5m", 50 -> "50m". */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest}m`;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

function sessionLength(session: TimedSession): number {
    return toMinutes(session.time.end) - toMinutes(session.time.start);
}

/** Minutes of class per week across every meeting day. */
export function weeklyMinutes(sessions: ClassSession[]): number {
    return sessions.filter(isTimed).reduce((total, session) => total + sessionLength(session) * session.days.length, 0);
}

export type CampusNow = { day: Day | null; minutes: number };

/** The current weekday and time of day on campus, in its `timeZone`, regardless of where the code runs. */
export function campusNow(timeZone: string, date = new Date()): CampusNow {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const weekday = part("weekday");
    const day = days.find((d) => dayNames[d].short === weekday) ?? null;
    return { day, minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}
