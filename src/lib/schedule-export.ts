import { formatCourseCode, sessionName } from "./schedule";
import type { TermInfo } from "./terms";
import { isTimed, type TimedSession } from "./time";
import type { ClassSession, Day } from "./types";

export const exportFormats = ["png", "pdf", "ics"] as const;
export type ExportFormat = (typeof exportFormats)[number];

export const exportFormatLabels: Record<ExportFormat, string> = {
    png: "Image (PNG)",
    pdf: "PDF",
    ics: "Calendar file (ICS)",
};

function download(href: string, filename: string) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = href;
    link.click();
}

async function renderElement(element: HTMLElement) {
    const { default: html2canvas } = await import("html2canvas");
    const background = getComputedStyle(document.body).backgroundColor;
    return html2canvas(element, { backgroundColor: background, scale: 2 });
}

const rruleDays: Record<Day, string> = { M: "MO", T: "TU", W: "WE", R: "TH", F: "FR", S: "SA" };
const weekdayIndex: Record<Day, number> = { M: 1, T: 2, W: 3, R: 4, F: 5, S: 6 };

/** The first day of classes in `term`: its start date, or today for a term the site doesn't know. */
function termStart(term: string, terms: TermInfo[]): Date {
    const startsOn = terms.find((info) => info.code === term)?.startsOn;
    if (!startsOn) return new Date();
    const [year, month, day] = startsOn.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function firstMeeting(session: TimedSession, terms: TermInfo[]): string {
    const date = termStart(session.term, terms);
    const offset = (weekdayIndex[session.days[0]] - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function toIcs(sessions: ClassSession[], terms: TermInfo[], timezone: string): string {
    const events = sessions.filter(isTimed).map((session) => {
        const day = firstMeeting(session, terms);
        return [
            "BEGIN:VEVENT",
            `DTSTART;TZID=${timezone}:${day}T${session.time.start}00`,
            `DTEND;TZID=${timezone}:${day}T${session.time.end}00`,
            `RRULE:FREQ=WEEKLY;BYDAY=${session.days.map((d) => rruleDays[d]).join(",")}`,
            `LOCATION:${session.location}`,
            `SUMMARY:${formatCourseCode(session.course)} ${sessionName(session)}`,
            `DESCRIPTION:CRN ${session.crn}`,
            "END:VEVENT",
        ].join("\n");
    });
    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//DalSearch//Schedule Export//EN",
        ...events,
        "END:VCALENDAR",
    ].join("\n");
}

/**
 * Downloads a schedule as an image or PDF of `element`, or as a calendar file of `sessions` that starts
 * on each term's first day, in the university's `timezone`.
 */
export async function exportSchedule(
    format: ExportFormat,
    element: HTMLElement | null,
    sessions: ClassSession[],
    terms: TermInfo[],
    timezone: string,
) {
    if (format === "ics") {
        download(`data:text/calendar;charset=utf-8,${encodeURIComponent(toIcs(sessions, terms, timezone))}`, "schedule.ics");
        return;
    }
    if (!element) return;

    const canvas = await renderElement(element);
    if (format === "png") {
        download(canvas.toDataURL("image/png"), "schedule.png");
        return;
    }
    const { default: JsPdf } = await import("jspdf");
    const pdf = new JsPdf({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("schedule.pdf");
}
