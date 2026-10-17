// Writes calendars in iCalendar (RFC 5545) for the downloaded file and the subscription feed. Events
// are wall-clock times in the university's timezone, so a 10:05 class shows at 10:05 campus time in
// any calendar app, wherever the student is.

import type { Day } from "./types";

/** An event at a campus time. `date` is "2026-09-08"; `start` and `end` are "10:05" in `timeZone`. */
export type IcsEvent = {
    uid: string;
    summary: string;
    timeZone: string;
    date: string;
    start: string;
    end: string;
    /** Repeats every week on `days` until the end of `until`, for classes. */
    weekly?: { days: Day[]; until: string };
    location?: string;
    description?: string;
    url?: string;
};

const MAX_LINE_OCTETS = 75;

const byDay: Record<Day, string> = { M: "MO", T: "TU", W: "WE", R: "TH", F: "FR", S: "SA" };

export function escapeText(value: string): string {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r\n|\r|\n/g, "\\n");
}

/** Lines longer than 75 octets continue on the next line after a space, never splitting a character. */
export function foldLine(line: string): string {
    const encoder = new TextEncoder();
    if (encoder.encode(line).length <= MAX_LINE_OCTETS) return line;
    const parts: string[] = [];
    let current = "";
    let octets = 0;
    for (const char of line) {
        const size = encoder.encode(char).length;
        if (octets + size > (parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1)) {
            parts.push(current);
            current = "";
            octets = 0;
        }
        current += char;
        octets += size;
    }
    parts.push(current);
    return parts.join("\r\n ");
}

/** "2026-09-08", "10:05" -> "20260908T100500" */
const localDateTime = (date: string, time: string) => `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

/** "2026-09-08T10:05:00.000Z" -> "20260908T100500Z" */
const utcDateTime = (date: Date) => `${date.toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;

/** Minutes `timeZone` is ahead of UTC at `date` (negative in the Americas). */
function offsetMinutes(timeZone: string, date: Date): number {
    const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
        .formatToParts(date)
        .find((part) => part.type === "timeZoneName")?.value;
    const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

/** The instant a campus wall-clock time happens. */
export function campusInstant(date: string, time: string, timeZone: string): Date {
    const asUtc = new Date(`${date}T${time}:00Z`);
    return new Date(asUtc.getTime() - offsetMinutes(timeZone, asUtc) * 60_000);
}

/** The campus date and time of an instant: ["2026-12-09", "14:00"]. */
export function campusDateTime(instant: Date, timeZone: string): [string, string] {
    const shifted = new Date(instant.getTime() + offsetMinutes(timeZone, instant) * 60_000).toISOString();
    return [shifted.slice(0, 10), shifted.slice(11, 16)];
}

/** "+0300", "-0230" */
function formatOffset(minutes: number): string {
    const sign = minutes < 0 ? "-" : "+";
    const abs = Math.abs(minutes);
    return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}${String(abs % 60).padStart(2, "0")}`;
}

/**
 * The timezone's definition, which Outlook needs to place TZID times. Every university is in Canada,
 * where clocks that change do so on the second Sunday of March and the first Sunday of November.
 */
function timezoneLines(timeZone: string, year: number): string[] {
    const winter = offsetMinutes(timeZone, new Date(Date.UTC(year, 0, 15)));
    const summer = offsetMinutes(timeZone, new Date(Date.UTC(year, 6, 15)));
    const rule = (name: string, from: number, to: number, start: string, repeat?: string) => [
        `BEGIN:${name}`,
        `DTSTART:${start}`,
        ...(repeat ? [`RRULE:${repeat}`] : []),
        `TZOFFSETFROM:${formatOffset(from)}`,
        `TZOFFSETTO:${formatOffset(to)}`,
        `END:${name}`,
    ];
    return [
        "BEGIN:VTIMEZONE",
        `TZID:${timeZone}`,
        ...(winter === summer
            ? rule("STANDARD", winter, winter, "19700101T000000")
            : [
                  ...rule("DAYLIGHT", winter, summer, "19700308T020000", "FREQ=YEARLY;BYMONTH=3;BYDAY=2SU"),
                  ...rule("STANDARD", summer, winter, "19701101T020000", "FREQ=YEARLY;BYMONTH=11;BYDAY=1SU"),
              ]),
        "END:VTIMEZONE",
    ];
}

function eventLines(event: IcsEvent, stamp: string): string[] {
    const { timeZone } = event;
    return [
        "BEGIN:VEVENT",
        `UID:${event.uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${timeZone}:${localDateTime(event.date, event.start)}`,
        `DTEND;TZID=${timeZone}:${localDateTime(event.date, event.end)}`,
        ...(event.weekly
            ? [
                  `RRULE:FREQ=WEEKLY;BYDAY=${event.weekly.days.map((day) => byDay[day]).join(",")};UNTIL=${utcDateTime(
                      campusInstant(event.weekly.until, "23:59", timeZone),
                  )}`,
              ]
            : []),
        `SUMMARY:${escapeText(event.summary)}`,
        ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
        ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
        ...(event.url ? [`URL:${event.url}`] : []),
        "END:VEVENT",
    ];
}

export function buildCalendar({ name, events, now = new Date() }: { name: string; events: IcsEvent[]; now?: Date }): string {
    const timeZones = [...new Set(events.map((event) => event.timeZone))];
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Termly//Schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${escapeText(name)}`,
        // How often subscribers should check for changes. Apple and Outlook honour it; Google doesn't.
        "REFRESH-INTERVAL;VALUE=DURATION:PT3H",
        "X-PUBLISHED-TTL:PT3H",
        ...timeZones.flatMap((timeZone) => timezoneLines(timeZone, now.getUTCFullYear())),
        ...events.flatMap((event) => eventLines(event, utcDateTime(now))),
        "END:VCALENDAR",
    ];
    return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
