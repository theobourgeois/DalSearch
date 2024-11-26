"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClassSession, Course, Day, days, Term, terms, TimeSlot } from "@/utils/course";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import React from "react";

const colors = [
  "#3498db",  // Bright Blue
  "#2ecc71",  // Emerald Green
  "#e74c3c",  // Vibrant Red
  "#f39c12",  // Warm Orange
  "#9b59b6",  // Rich Purple
  "#1abc9c",  // Turquoise
  "#e67e22",  // Carrot Orange
  "#34495e",  // Dark Slate Blue
  "#16a085",  // Dark Turquoise
  "#8e44ad",  // Deep Purple
  "#d35400",  // Pumpkin Orange
  "#27ae60",  // Jade Green
  "#2980b9",  // Strong Blue
  "#c0392b",  // Deep Red
  "#f1c40f",  // Bright Yellow
  "#2c3e50",  // Dark Blue Gray
  "#7f8c8d",  // Gray
  "#27ae60",  // Emerald Green
  "#2874a6",  // Ocean Blue
  "#a04000",  // Deep Brown
  "#117864",  // Dark Teal
  "#6c3483"   // Deep Violet
]


const CELL_HEIGHT = 60
const TIME_QUANTUM_MIN = 30
const NUM_HOURS = 14;
const NUM_TIME_SLOTS = NUM_HOURS * (60 / TIME_QUANTUM_MIN);
const START_HOUR = 8;

const getDay = (day: string) => {
  switch (day) {
    case "M":
      return "Monday"
    case "T":
      return "Tuesday"
    case "W":
      return "Wednesday"
    case "R":
      return "Thursday"
    case "F":
      return "Friday"
    case "S":
      return "Saturday"
  }
}

const scheduleTimes = Array.from({ length: NUM_TIME_SLOTS }, (_, i) => {
  const hour = Math.floor(i / (60 / TIME_QUANTUM_MIN)) + START_HOUR;
  const minute = (i % (60 / TIME_QUANTUM_MIN)) * TIME_QUANTUM_MIN;
  return `${hour.toString().padStart(2, "0")}${minute.toString().padStart(2, "0")}`;
})

function findClosestTimeSlotRow(time: string) {
  const hour = parseInt(time.slice(0, 2));
  const minute = parseInt(time.slice(2, 4));
  const slot = hour * (60 / TIME_QUANTUM_MIN) + minute / TIME_QUANTUM_MIN;
  const timeSlot = scheduleTimes.find((scheduleTime) => {
    const scheduleHour = parseInt(scheduleTime.slice(0, 2));
    const scheduleMinute = parseInt(scheduleTime.slice(2, 4));
    const scheduleSlot = scheduleHour * (60 / TIME_QUANTUM_MIN) + scheduleMinute / TIME_QUANTUM_MIN;
    return scheduleSlot >= slot;
  });

  return scheduleTimes.indexOf(timeSlot ?? "");
}

function formatTime(time: string) {
  const hour = time.slice(0, 2);
  const minute = time.slice(2, 4);
  return `${hour}:${minute}`;
}


export function Schedule({ course }: { course: Course }) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term>(Object.keys(terms)[0] as Term);
  const termClasses = useMemo(() => {
    return course.termClasses.filter((termClass) => termClass.time.start !== "C/D" && selectedClasses.includes(termClass.section) && termClass.term === selectedTerm);
  }, [course.termClasses, selectedClasses, selectedTerm]);
  const classColors = useMemo(() => {
    return course.termClasses.reduce((acc, termClass, index) => {
      const color = colors[index % colors.length];
      const key = termClass.section + termClass.term;
      acc[key] = color;
      return acc;
    }, {} as Record<string, string>);
  }, [course.termClasses]);

  useEffect(() => {
    // set selected classes to all classes in the selected termClasses
    setSelectedClasses(course.termClasses.filter((termClass) => termClass.term === selectedTerm).map((termClass) => termClass.section));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm])

  useEffect(() => {
    // if not course in the first term, select the second term
    if (course.termClasses.every((termClass) => termClass.term !== Object.keys(terms)[0])) {
      setSelectedTerm(Object.keys(terms)[1] as Term);
    }
  }, [course.termClasses])


  const handleSelect = (value: string[]) => {
    setSelectedClasses(value);
  }

  const handleSemesterSelect = (value: Term) => {
    setSelectedTerm(value);
  }

  return (
    <div>
      <Label>Select term</Label>
      <Select onValueChange={handleSemesterSelect} value={selectedTerm}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent >
          {(Object.keys(terms) as Term[]).map((semester) => (
            <SelectItem key={semester} value={semester}>
              {terms[semester]}
            </SelectItem>
          ))}

        </SelectContent>
      </Select>
      <ToggleGroup onValueChange={handleSelect} value={selectedClasses} type="multiple" className="flex-wrap flex my-4">
        {course.termClasses.filter((termClass) => termClass.term === selectedTerm).map((termClass) => {
          const id = termClass.section
          return (
            <ToggleGroupItem key={id} value={id} style={{
              backgroundColor: selectedClasses.includes(id) ? classColors[termClass.section + termClass.term] + "80" : "",
            }}>
              {termClass.type} {termClass.section} {termClass.time.start === "C/D" ? "(ONLINE)" : ""}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <div className="grid grid-cols-[repeat(6,minmax(0,1fr))] w-full relative h-full">
        {days.map((day, index) => (
          <div key={day} style={{
            gridRow: 1,
            gridColumn: index + 1,
          }} className="bg-gray-100 border border-gray-200 text-center">
            <p>{getDay(day)}</p>
          </div>
        ))}
      </div>
      <div className="relative">
        <div className="w-full grid grid-cols-1 grid-rows-4 absolute">
          {scheduleTimes.map((time) => (
            <div key={time}
              style={{
                height: CELL_HEIGHT,
              }}
              className="bg-gray-100 border border-r-5 border-gray-200">
              {Array.from({ length: 6 }).map((_, i) => (
                <p className="-translate-x-14" key={i}>{
                  i === 0 ? formatTime(time) : ""
                }</p>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div key={1} style={{
        gridTemplateRows: `repeat(${scheduleTimes.length},minmax(0,1fr)`,
      }} className="grid grid-cols-[repeat(6,minmax(0,1fr))] w-full relative h-full">
        {termClasses.map((termClass, index) => (
          <Fragment key={index}>
            {termClass.days.map((day) => (
              <ScheduleCourse key={termClass.section + day} day={day} termClass={termClass} classColors={classColors} termClasses={termClasses} index={index} />
            ))}
          </Fragment>
        ))}
      </div>

    </div >
  )
}

function ScheduleCourse({ day, termClass, classColors, termClasses, index }: { termClass: ClassSession, classColors: Record<string, string>, termClasses: ClassSession[], index: number, day: Day }) {
  const startRow = findClosestTimeSlotRow(termClass.time.start);
  const endRow = findClosestTimeSlotRow(termClass.time.end) + 1;
  const color = classColors[termClass.section + termClass.term];

  const dayIndex = days.indexOf(day);
  const dayName = getDay(day);
  const isPerfectConflict = termClasses.some((otherClass, otherIndex) => {
    if (index > otherIndex) {
      return false;
    }
    if (termClass === otherClass) {
      return false;
    }
    const otherClassStartRow = findClosestTimeSlotRow(otherClass.time.start);
    const otherClassEndRow = findClosestTimeSlotRow(otherClass.time.end) + 1
    if (otherClass.days.includes(day)) {
      const isSameTime = startRow === otherClassStartRow && endRow === otherClassEndRow;
      return isSameTime;
    }
  });

  return (
    <div
      className={cn(
        `rounded-md font-medium text-white m-[1px]`,
      )}
      style={{
        transform: isPerfectConflict ? "translate(8px, -8px)" : "",
        backgroundColor: isPerfectConflict ? color : `${color}90`,
        border: `1px solid ${color}`,
        gridRow: `${startRow} / ${endRow}`,
        gridColumn: `${dayIndex + 1} / ${dayIndex + 2}`,
        height: CELL_HEIGHT * (endRow - startRow),
      }}
    >
      <div className="p-2 text-[1vw]">
        <p>{dayName}</p>
        <p>{formatTime(termClass.time.start)} - {formatTime(termClass.time.end)}</p>
        <p>{termClass.location}</p>
      </div>
    </div>
  )
}
