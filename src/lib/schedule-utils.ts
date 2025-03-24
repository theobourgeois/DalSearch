import { createContext } from "react";
import { Day } from "./types";

export const CELL_HEIGHT = 60;
export const TIME_QUANTUM_MIN = 30;
export const NUM_HOURS = 14;
export const NUM_TIME_SLOTS = NUM_HOURS * (60 / TIME_QUANTUM_MIN);
export const START_HOUR = 8;

export const colors = [
  "#3498db", // Bright Blue
  "#2ecc71", // Emerald Green
  "#e74c3c", // Vibrant Red
  "#f39c12", // Warm Orange
  "#9b59b6", // Rich Purple
  "#1abc9c", // Turquoise
  "#e67e22", // Carrot Orange
  "#34495e", // Dark Slate Blue
  "#16a085", // Dark Turquoise
  "#8e44ad", // Deep Purple
  "#d35400", // Pumpkin Orange
  "#27ae60", // Jade Green
  "#2980b9", // Strong Blue
  "#c0392b", // Deep Red
  "#f1c40f", // Bright Yellow
  "#2c3e50", // Dark Blue Gray
  "#7f8c8d", // Gray
  "#27ae60", // Emerald Green
  "#2874a6", // Ocean Blue
  "#a04000", // Deep Brown
  "#117864", // Dark Teal
  "#6c3483", // Deep Violet
];

export type ViewMode = "day" | "week";

export const ScheduleContext = createContext<{
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  currentDay: string;
}>({
  viewMode: "week",
  setViewMode: () => { },
  currentDay: "M",
});

export const isMobileView = (() => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 640;
})();

export const getDay = (day: Day) => {
  switch (day) {
    case "M":
      return "Monday";
    case "T":
      return "Tuesday";
    case "W":
      return "Wednesday";
    case "R":
      return "Thursday";
    case "F":
      return "Friday";
    case "S":
      return "Saturday";
  }
};

export function formatTime(time: string) {
  const hour = time.slice(0, 2);
  const isAm = parseInt(hour) < 12;

  return `${parseInt(hour) % 12 || 12}:${time.slice(2, 4)} ${isAm ? "AM" : "PM"
    }`;
}

export const scheduleTimes = Array.from({ length: NUM_TIME_SLOTS }, (_, i) => {
  const hour = Math.floor(i / (60 / TIME_QUANTUM_MIN)) + START_HOUR;
  const minute = (i % (60 / TIME_QUANTUM_MIN)) * TIME_QUANTUM_MIN;
  return `${hour.toString().padStart(2, "0")}${minute
    .toString()
    .padStart(2, "0")}`;
});