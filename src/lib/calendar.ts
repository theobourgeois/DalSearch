import { weekdays } from "./constants";
import type { ScheduleConflict } from "./schedule";
import { isTimed, toMinutes, type TimedSession } from "./time";
import type { ClassSession, Day } from "./types";

export type CalendarEventVariant = "neutral" | "tinted" | "accent" | "ghost";

export type CalendarEvent = {
    id: string;
    day: Day;
    /** Minutes after midnight. */
    start: number;
    end: number;
    title: string;
    lines?: string[];
    variant: CalendarEventVariant;
    /** Course colour: the dot on neutral events, the fill on tinted ones. */
    color?: string;
    conflict?: boolean;
    href?: string;
    onSelect?: () => void;
    label?: string;
};

type EventDetails = Omit<CalendarEvent, "id" | "day" | "start" | "end">;

/** The id of a session's meeting on one day; conflicts are tracked per meeting, not per section. */
export const meetingId = (crn: string, day: Day) => `${crn}-${day}`;

/** One calendar event per meeting day of a session; sessions without a set time produce none. */
export function sessionEvents(
    session: ClassSession,
    details: (session: TimedSession, id: string) => EventDetails,
): CalendarEvent[] {
    if (!isTimed(session)) return [];
    return session.days.map((day) => {
        const id = meetingId(session.crn, day);
        return {
            id,
            day,
            start: toMinutes(session.time.start),
            end: toMinutes(session.time.end),
            ...details(session, id),
        };
    });
}

/** Ids of every meeting that's part of a clash. */
export function conflictingMeetings(conflicts: ScheduleConflict[]): Set<string> {
    return new Set(
        conflicts.flatMap(({ first, second, days }) =>
            days.flatMap((day) => [meetingId(first.crn, day), meetingId(second.crn, day)]),
        ),
    );
}

export type PositionedEvent = CalendarEvent & { lane: number; lanes: number };

/** Places overlapping events side by side, giving every group of overlapping events equal-width lanes. */
export function layoutDay(events: CalendarEvent[]): PositionedEvent[] {
    const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
    const positioned: PositionedEvent[] = [];
    let group: PositionedEvent[] = [];
    let groupEnd = -1;

    const closeGroup = () => {
        const lanes = Math.max(1, ...group.map((event) => event.lane + 1));
        group.forEach((event) => positioned.push({ ...event, lanes }));
        group = [];
    };

    for (const event of sorted) {
        if (event.start >= groupEnd && group.length > 0) closeGroup();
        const laneEnds = group.reduce<number[]>((ends, other) => {
            ends[other.lane] = Math.max(ends[other.lane] ?? 0, other.end);
            return ends;
        }, []);
        const freeLane = laneEnds.findIndex((end) => end <= event.start);
        group.push({ ...event, lane: freeLane === -1 ? laneEnds.length : freeLane, lanes: 1 });
        groupEnd = Math.max(groupEnd, event.end);
    }
    closeGroup();
    return positioned;
}

/** Monday to Friday, plus Saturday when anything meets then. */
export function calendarDays(events: CalendarEvent[]): Day[] {
    return events.some((event) => event.day === "S") ? [...weekdays, "S"] : [...weekdays];
}

/** The hour range a calendar needs to show every event, never narrower than 8:00 to 18:00. */
export function hourRange(events: CalendarEvent[]): [number, number] {
    const first = Math.min(8 * 60, ...events.map((event) => event.start));
    const last = Math.max(18 * 60, ...events.map((event) => event.end));
    return [Math.floor(first / 60), Math.ceil(last / 60)];
}
