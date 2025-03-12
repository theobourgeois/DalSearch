"use client"
import { colors } from "@/lib/schedule-utils";
import { ClassSession, Day, Term } from "@/lib/types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { create } from "zustand";

type ScheduleTimeSlot = {
    class: ClassSession;
    color: string;
};
export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number];

export const DOWNLOAD_FORMATS = ["png", "pdf", "ics"] as const;

type ScheduleStore = {
    timeSlots: ScheduleTimeSlot[];
    term: Term;
    setTerm: (term: Term) => void;
    addTimeSlot: (termClass: ClassSession) => void;
    removeTimeSlot: (crn: string) => void;
    downloadSchedule: (format: DownloadFormat, timeSlots: ScheduleTimeSlot[]) => void;
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
const downloadICS = (timeSlots: ClassSession[]) => {
    // Helper function to convert day abbreviations to RRULE day formats
    const convertDayToRRule = (day: Day): string => {
        const mapping: Record<Day, string> = {
            'M': 'MO',
            'T': 'TU',
            'W': 'WE',
            'R': 'TH',
            'F': 'FR',
            'S': 'SA'
        };
        return mapping[day];
    };

    // Helper function to get day number (0 = Sunday, 1 = Monday, etc.)
    const getDayNumber = (day: Day): number => {
        const mapping: Record<Day, number> = {
            'M': 1,
            'T': 2,
            'W': 3,
            'R': 4,
            'F': 5,
            'S': 6
        };
        return mapping[day];
    };

    // Function to get the start date for a term
    const getTermStartDate = (term: string): Date => {
        const year = parseInt(term.substring(0, 4));
        const termCode = term.substring(4, 6);

        let startDate = new Date(year, 8, 1);

        switch (termCode) {
            case "10": // Fall term
                startDate = new Date(year, 8, 1);
                break;
            case "20": // Winter term
                startDate = new Date(year, 0, 6);
                break;
            case "30": // Summer term
                startDate = new Date(year, 4, 1);
                break;
        }

        return startDate;
    };

    // Function to format date for ICS
    const formatDateForICS = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    // Function to find the next occurrence of a specific day of week
    const findNextDayOccurrence = (startDate: Date, dayOfWeek: number): Date => {
        const result = new Date(startDate);
        const currentDay = result.getDay();

        const daysToAdd = (dayOfWeek - currentDay + 7) % 7;

        if (daysToAdd === 0) {
            return result;
        }

        result.setDate(result.getDate() + daysToAdd);
        return result;
    };

    const icsData = timeSlots
        .map((slot) => {
            // Get the RRULE day formats
            const rRuleDays = slot.days.map(day => convertDayToRRule(day)).join(",");

            const firstDay = slot.days[0];
            const dayNumber = getDayNumber(firstDay);

            const termStartDate = getTermStartDate(slot.term);

            const firstClassDate = findNextDayOccurrence(termStartDate, dayNumber);

            const formattedDate = formatDateForICS(firstClassDate);

            const startTime = typeof slot.time.start === 'string' && slot.time.start !== 'C/D'
                ? slot.time.start
                : '0900';
            const endTime = typeof slot.time.end === 'string' && slot.time.end !== 'C/D'
                ? slot.time.end
                : '1000';

            const startDateTime = `${formattedDate}T${startTime}00`;
            const endDateTime = `${formattedDate}T${endTime}00`;

            const location = slot.location;
            const title = `${slot.course} - ${slot.section}`;
            const description = `Type: ${slot.type}\nDays: ${slot.days.join(",")}\nLocation: ${location}`;

            return `BEGIN:VEVENT
DTSTART;TZID=America/Halifax:${startDateTime}
DTEND;TZID=America/Halifax:${endDateTime}
RRULE:FREQ=WEEKLY;BYDAY=${rRuleDays}
LOCATION:${location}
SUMMARY:${title}
DESCRIPTION:${description}
END:VEVENT`;
        })
        .join("\n");

    const link = document.createElement("a");
    link.download = "schedule.ics";
    link.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DalSearch//Schedule Export//EN
${icsData}
END:VCALENDAR`)}`;
    link.click();
};

function downloadSchedule(
    container: HTMLElement,
    format: DownloadFormat,
    timeSlots: ClassSession[]
) {
    switch (format) {
        case "pdf":
            downloadPDF(container);
            break;
        case "png":
            downloadPNG(container);
            break;
        case "ics":
            downloadICS(timeSlots);
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
    downloadSchedule: (format, timeSlots) =>
        set((state) => {
            if (!state.container) return state;
            downloadSchedule(state.container, format, timeSlots.map((slot) => slot.class));
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
