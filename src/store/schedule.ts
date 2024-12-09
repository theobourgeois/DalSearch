import { ClassSession } from '@/utils/course'
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { create } from 'zustand'

type ScheduleTimeSlot = {
  class: ClassSession;
  color: string;
}
type DownloadFormat = 'ics' | 'png' | 'pdf' | 'csv'

type ScheduleStore = {
  timeSlots: ScheduleTimeSlot[];
  addTimeSlot: (termClass: ClassSession) => void;
  removeTimeSlot: (crn: string) => void;
  downloadSchedule: (container: HTMLElement, format: DownloadFormat) => void;
}

function getDefaultScheduleTimeSlots() {
  const timeSlots = localStorage.getItem('timeSlots') || null
  return (timeSlots ? JSON.parse(timeSlots) : []) as ScheduleTimeSlot[]
}

function updateLocalStorage(timeSlots: ScheduleTimeSlot[]) {
  localStorage.setItem('timeSlots', JSON.stringify(timeSlots))
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


function downloadSchedule(container: HTMLElement, format: DownloadFormat) {
  switch (format) {
    case 'pdf':
      downloadPDF(container)
      break
    case 'png':
      downloadPNG(container)
      break
    default:
      console.log('Unsupported format')
  }
}

const useScheduleStore = create<ScheduleStore>((set) => ({
  timeSlots: getDefaultScheduleTimeSlots(),
  addTimeSlot: (termClass) => set((state) => {
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    const newTimeSlot = { class: termClass, color };
    const newTimeSlots = [...state.timeSlots, newTimeSlot];
    updateLocalStorage(newTimeSlots);
    return { timeSlots: newTimeSlots, notificationNum: state.notificationNum + 1 }
  }),
  removeTimeSlot: (crn: string) => set((state) => {
    const newTimeSlots = state.timeSlots.filter((slot) => slot.class.crn !== crn);
    updateLocalStorage(newTimeSlots);
    return { timeSlots: newTimeSlots }
  }),
  downloadSchedule: (container, format) => downloadSchedule(container, format)
}))

export function useSchedule() {
  return useScheduleStore((state) => state)
}