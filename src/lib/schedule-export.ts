import { formatLocation } from "./location";
import { formatCourseCode, sessionName } from "./schedule";
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

/** Approximate first day of classes for a term code such as "202620". */
function termStart(term: string): Date {
    const year = Number(term.slice(0, 4));
    switch (term.slice(4)) {
        case "10":
            return new Date(year - 1, 8, 1);
        case "30":
            return new Date(year, 4, 1);
        default:
            return new Date(year, 0, 6);
    }
}

function firstMeeting(session: TimedSession): string {
    const date = termStart(session.term);
    const offset = (weekdayIndex[session.days[0]] - date.getDay() + 7) % 7;
    date.setDate(date.getDate() + offset);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function toIcs(sessions: ClassSession[]): string {
    const events = sessions.filter(isTimed).map((session) => {
        const day = firstMeeting(session);
        return [
            "BEGIN:VEVENT",
            `DTSTART;TZID=America/Halifax:${day}T${session.time.start}00`,
            `DTEND;TZID=America/Halifax:${day}T${session.time.end}00`,
            `RRULE:FREQ=WEEKLY;BYDAY=${session.days.map((d) => rruleDays[d]).join(",")}`,
            `LOCATION:${formatLocation(session.location)}`,
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

/** Downloads a schedule as an image or PDF of `element`, or as a calendar file of `sessions`. */
export async function exportSchedule(format: ExportFormat, element: HTMLElement | null, sessions: ClassSession[]) {
    if (format === "ics") {
        download(`data:text/calendar;charset=utf-8,${encodeURIComponent(toIcs(sessions))}`, "schedule.ics");
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
