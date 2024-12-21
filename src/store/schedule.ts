"use client"
import { colors } from "@/components/schedule";
import { ClassSession, Term } from "@/utils/course";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { create } from "zustand";

type ScheduleTimeSlot = {
    class: ClassSession;
    color: string;
};
export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number];

export const DOWNLOAD_FORMATS = ["png", "pdf"] as const;

type ScheduleStore = {
    timeSlots: ScheduleTimeSlot[];
    term: Term;
    setTerm: (term: Term) => void;
    addTimeSlot: (termClass: ClassSession) => void;
    removeTimeSlot: (crn: string) => void;
    downloadSchedule: (format: DownloadFormat) => void;
    container: HTMLElement | null;
    setContainer: (container: HTMLElement) => void;
};

function getDefaultScheduleTimeSlots() {
    const timeSlots = localStorage.getItem("timeSlots") || null;
    return (timeSlots ? JSON.parse(timeSlots) : []) as ScheduleTimeSlot[];
}

function updateLocalStorage(timeSlots: ScheduleTimeSlot[]) {
    localStorage.setItem("timeSlots", JSON.stringify(timeSlots));
}

const downloadPNG = (container: HTMLElement) => {
    html2canvas(container).then((canvas) => {
        const link = document.createElement("a");
        link.download = "schedule.png";
        link.href = canvas.toDataURL();
        link.click();
    });
};

const downloadPDF = (container: HTMLElement) => {
    console.log(container)
    html2canvas(container).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("schedule.pdf");
    });
};

function downloadSchedule(
    container: HTMLElement,
    format: DownloadFormat,
) {
    switch (format) {
        case "pdf":
            downloadPDF(container);
            break;
        case "png":
            downloadPNG(container);
            break;
        default:
            console.log("Unsupported format");
    }
}

const useScheduleStore = create<ScheduleStore>((set) => ({
    timeSlots: getDefaultScheduleTimeSlots(),
    addTimeSlot: (termClass) =>
        set((state) => {
            const color = colors[state.timeSlots.length % colors.length];
            const newTimeSlot = { class: termClass, color };
            const newTimeSlots = [...state.timeSlots, newTimeSlot];
            updateLocalStorage(newTimeSlots);
            return { timeSlots: newTimeSlots };
        }),
    removeTimeSlot: (crn: string) =>
        set((state) => {
            const newTimeSlots = state.timeSlots.filter(
                (slot) => slot.class.crn !== crn
            );
            updateLocalStorage(newTimeSlots);
            return { timeSlots: newTimeSlots };
        }),
    downloadSchedule: (format) =>
        set((state) => {
            if (!state.container) return state;
            downloadSchedule(state.container, format);
            return state;
        }),
    container: null,
    setContainer: (container) => set({ container }),
    term: "202520",
    setTerm: (term) => set({ term }),
}));

export function useSchedule() {
    return useScheduleStore((state) => state);
}
