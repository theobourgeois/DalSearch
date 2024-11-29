"use client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ClassSession, Course, Day, days, Term, terms } from "@/utils/course";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import React from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogHeader,
    DialogDescription,
} from "@/components/ui/dialog";

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

export const CELL_HEIGHT = 40;
export const TIME_QUANTUM_MIN = 30;
export const NUM_HOURS = 13;
export const NUM_TIME_SLOTS = NUM_HOURS * (60 / TIME_QUANTUM_MIN);
export const START_HOUR = 8;

const getDay = (day: string) => {
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

export const scheduleTimes = Array.from({ length: NUM_TIME_SLOTS }, (_, i) => {
    const hour = Math.floor(i / (60 / TIME_QUANTUM_MIN)) + START_HOUR;
    const minute = (i % (60 / TIME_QUANTUM_MIN)) * TIME_QUANTUM_MIN;
    return `${hour.toString().padStart(2, "0")}${minute
        .toString()
        .padStart(2, "0")}`;
});

function findClosestTimeSlotRow(time: string) {
    const hour = parseInt(time.slice(0, 2));
    const minute = parseInt(time.slice(2, 4));
    const slot = hour * (60 / TIME_QUANTUM_MIN) + minute / TIME_QUANTUM_MIN;
    const timeSlot = scheduleTimes.find((scheduleTime) => {
        const scheduleHour = parseInt(scheduleTime.slice(0, 2));
        const scheduleMinute = parseInt(scheduleTime.slice(2, 4));
        const scheduleSlot =
            scheduleHour * (60 / TIME_QUANTUM_MIN) +
            scheduleMinute / TIME_QUANTUM_MIN;
        return scheduleSlot >= slot;
    });

    return scheduleTimes.indexOf(timeSlot ?? "");
}

function formatTime(time: string) {
    const hour = time.slice(0, 2);
    const isAm = parseInt(hour) < 12;

    return `${parseInt(hour) % 12 || 12}:${time.slice(2, 4)} ${
        isAm ? "AM" : "PM"
    }`;
}

export function ScheduleBackground({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex bg-white rounded-md  overflow-hidden border border-gray-200">
            <div className="bg-gray-50 border-r border-gray-200">
                {scheduleTimes.map((time) => (
                    <div
                        key={time}
                        style={{
                            height: CELL_HEIGHT,
                        }}
                        className="px-2 flex items-center justify-end text-sm text-gray-500 font-medium"
                    >
                        {formatTime(time)}
                    </div>
                ))}
            </div>

            <div className="flex-1">
                <div className="grid grid-cols-6 border-b border-gray-200">
                    {days.map((day) => (
                        <div key={day} className="py-2 text-center bg-gray-50">
                            <p className="hidden lg:block text-sm font-semibold text-gray-700">
                                {getDay(day)}
                            </p>
                            <p className="block lg:hidden text-xs font-medium text-gray-600">
                                {day}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="relative">
                    <div className="absolute inset-0">
                        <div className="grid grid-cols-6 h-full">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="border-r border-gray-200 last:border-r-0"
                                />
                            ))}
                        </div>
                        <div className="grid grid-rows-4">
                            {scheduleTimes.map((time) => (
                                <div
                                    key={time}
                                    style={{ height: CELL_HEIGHT }}
                                    className="border-b border-gray-200 last:border-b-0"
                                />
                            ))}
                        </div>
                    </div>
                    <div
                        style={{
                            gridTemplateRows: `repeat(${scheduleTimes.length},minmax(0,1fr))`,
                        }}
                        className="grid grid-cols-6 relative"
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function Schedule({ course }: { course: Course }) {
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [selectedTerm, setSelectedTerm] = useState<Term>(
        Object.keys(terms)[0] as Term
    );
    const termClasses = useMemo(() => {
        return course.termClasses.filter(
            (termClass) =>
                termClass.time.start !== "C/D" &&
                selectedClasses.includes(termClass.section) &&
                termClass.term === selectedTerm
        );
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
        setSelectedClasses(
            course.termClasses
                .filter((termClass) => termClass.term === selectedTerm)
                .map((termClass) => termClass.section)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTerm]);

    useEffect(() => {
        // if not course in the first term, select the second term
        if (
            course.termClasses.every(
                (termClass) => termClass.term !== Object.keys(terms)[0]
            )
        ) {
            setSelectedTerm(Object.keys(terms)[1] as Term);
        }
    }, [course.termClasses]);

    const handleSelect = (value: string[]) => {
        setSelectedClasses(value);
    };

    const handleSemesterSelect = (value: Term) => {
        setSelectedTerm(value);
    };

    return (
        <div>
            <Label>Select term</Label>
            <Select onValueChange={handleSemesterSelect} value={selectedTerm}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(terms) as Term[]).map((semester) => (
                        <SelectItem key={semester} value={semester}>
                            {terms[semester]}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <ToggleGroup
                onValueChange={handleSelect}
                value={selectedClasses}
                type="multiple"
                className="flex flex-wrap gap-2 my-4"
            >
                {course.termClasses
                    .filter((termClass) => termClass.term === selectedTerm)
                    .map((termClass) => {
                        const id = termClass.section;
                        const isSelected = selectedClasses.includes(id);
                        const bgColor = isSelected
                            ? classColors[termClass.section + termClass.term] +
                              "80"
                            : "";

                        return (
                            <HoverCard key={id}>
                                <HoverCardTrigger asChild>
                                    <ToggleGroupItem
                                        value={id}
                                        className="px-3 py-2 rounded-md transition-colors duration-200"
                                        style={{ backgroundColor: bgColor }}
                                    >
                                        <span className="font-medium">
                                            {termClass.type} {termClass.section}
                                        </span>
                                        {termClass.time.start === "C/D" && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                ONLINE
                                            </Badge>
                                        )}
                                    </ToggleGroupItem>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">
                                            {termClass.type} {termClass.section}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {course.title}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="flex items-center">
                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                <span className="text-sm">
                                                    {terms[termClass.term]}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="mr-2 h-4 w-4" />
                                                <span className="text-sm">
                                                    {termClass.time.start ===
                                                    "C/D"
                                                        ? "Asynchronous"
                                                        : `${termClass.time.start} - ${termClass.time.end}`}
                                                </span>
                                            </div>
                                            {termClass.time.start !== "C/D" && (
                                                <div className="flex items-center">
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    <span className="text-sm">
                                                        {termClass.location ||
                                                            "TBA"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {termClass.time.start !== "C/D" && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {termClass.days.map((day) => (
                                                    <Badge
                                                        key={day}
                                                        variant="outline"
                                                    >
                                                        {getDay(day)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        );
                    })}
            </ToggleGroup>
            <ScheduleBackground>
                {termClasses.map((termClass, index) => (
                    <Fragment key={index}>
                        {termClass.days.map((day) => (
                            <ScheduleCourse
                                key={termClass.section + day}
                                day={day}
                                termClass={termClass}
                                classColors={classColors}
                                termClasses={termClasses}
                                index={index}
                                course={""}
                            />
                        ))}
                    </Fragment>
                ))}
            </ScheduleBackground>
        </div>
    );
}

export function ScheduleCourse({
    day,
    termClass,
    classColors,
    termClasses,
    index,
    course,
}: {
    termClass: ClassSession;
    classColors: Record<string, string>;
    termClasses: ClassSession[];
    index: number;
    day: Day;
    course: string;
}) {
    const startRow = findClosestTimeSlotRow(termClass.time.start);
    const endRow = findClosestTimeSlotRow(termClass.time.end) + 1;
    const color = classColors[termClass.section + termClass.term + course];

    const dayIndex = days.indexOf(day);
    const dayName = getDay(day);
    const conflictIndex = termClasses.findIndex((otherClass, otherIndex) => {
        if (index === otherIndex) {
            return false;
        }
        if (
            otherClass.days.includes(day) &&
            otherClass.term === termClass.term
        ) {
            return (
                (otherClass.time.start <= termClass.time.start &&
                    otherClass.time.end > termClass.time.start) ||
                (otherClass.time.start < termClass.time.end &&
                    otherClass.time.end >= termClass.time.end)
            );
        }
    });
    const isConflict = conflictIndex >= 0;
    const isRight = isConflict && conflictIndex < index;

    const translateX = isRight ? "100%" : "0";
    const width = isConflict ? "50%" : "100%";

    const CourseContent = () => (
        <div className="p-2">
            {course && <h3 className="font-bold mb-2">{course}</h3>}
            <h3 className="font-bold mb-2">{termClass.section}</h3>
            <p className="text-sm mb-1">
                {dayName}, {formatTime(termClass.time.start)} -{" "}
                {formatTime(termClass.time.end)}
            </p>
            <p className="text-sm mb-2">{termClass.location}</p>
        </div>
    );

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Card
                                className={cn(
                                    "rounded-md font-medium text-foreground overflow-hidden cursor-pointer"
                                )}
                                style={{
                                    width,
                                    transform: `translateX(${translateX})`,
                                    gridRow: `${startRow} / ${endRow}`,
                                    gridColumn: `${dayIndex + 1} / ${
                                        dayIndex + 1
                                    }`,
                                    height: CELL_HEIGHT * (endRow - startRow),
                                    borderLeft: `6px solid ${color}`,
                                }}
                            >
                                <CardContent className="p-2 h-full flex flex-col justify-between">
                                    <div className="overflow-hidden">
                                        {course && (
                                            <h3 className="font-bold text-xs sm:text-sm md:text-base truncate">
                                                <Link
                                                    href={`/${course}`}
                                                    className="hover:underline"
                                                >
                                                    {course}
                                                </Link>
                                            </h3>
                                        )}
                                        <p className="font-bold text-xs sm:text-sm truncate">
                                            {termClass.type} {termClass.section}
                                        </p>
                                        <p className="text-xs text-muted-foreground hidden sm:block">
                                            {dayName}
                                        </p>
                                    </div>
                                    <div className="text-xs">
                                        <p className="truncate">
                                            {formatTime(termClass.time.start)} -{" "}
                                            {formatTime(termClass.time.end)}
                                        </p>
                                        <p className="truncate hidden sm:block">
                                            {termClass.location}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {course} {termClass.type}{" "}
                                    {termClass.section} Details
                                </DialogTitle>
                                <DialogDescription></DialogDescription>
                            </DialogHeader>

                            <CourseContent />
                        </DialogContent>
                    </Dialog>
                </TooltipTrigger>
                <TooltipContent side="right" className="hidden sm:block">
                    <CourseContent />
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
