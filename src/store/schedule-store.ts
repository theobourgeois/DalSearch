"use client"
import { colors } from "@/lib/schedule-utils";
import { ClassSession, Term } from "@/lib/types";
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
    setTimeSlots: (timeSlots: ClassSession[]) => void;
};

function getDefaultScheduleTimeSlots(): ScheduleTimeSlot[] {
    if (typeof window === 'undefined') return [];

    try {
        const timeSlots = localStorage.getItem("timeSlots");
        return timeSlots ? JSON.parse(timeSlots) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

function updateLocalStorage(timeSlots: ScheduleTimeSlot[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem("timeSlots", JSON.stringify(timeSlots));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
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
            console.error("Unsupported format");
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
    setTimeSlots: (timeSlots) => {
        const newTimeSlots = timeSlots.map((termClass, i) => ({
            class: termClass,
            color: colors[i % colors.length],
        }));
        updateLocalStorage(newTimeSlots);
        return set({ timeSlots: newTimeSlots });
    },
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
