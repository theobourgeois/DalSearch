import { SITE_NAME } from "@/lib/constants";
import { buildCalendar } from "./ics";
import { scheduleEvents, type ScheduleCalendar } from "./schedule-calendar";

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

/** Downloads a schedule as an image or PDF of `element`, or as a calendar file of its classes and exams. */
export async function exportSchedule(format: ExportFormat, element: HTMLElement | null, calendar: ScheduleCalendar) {
    if (format === "ics") {
        const ics = buildCalendar({ name: SITE_NAME, events: scheduleEvents(calendar) });
        download(`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`, "schedule.ics");
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
