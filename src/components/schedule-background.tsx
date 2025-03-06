"use client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { days } from "@/lib/course-utils";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import React from "react";
import { CalendarDays, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import {
    CELL_HEIGHT,
    formatTime,
    getDay,
    isMobileView,
    ScheduleContext,
    scheduleTimes,
    ViewMode,
} from "@/lib/schedule-utils";
import { Day } from "@/lib/types";

export function ScheduleBackground({
    children,
    ref,
    selectedDay = days[new Date().getDay() - 1], // today
}: {
    children: React.ReactNode;
    selectedDay?: string;
    ref?: React.RefObject<HTMLDivElement>;
}) {
    const [viewMode, setViewMode] = useState<ViewMode>(
        isMobileView ? "day" : "week"
    );
    const [currentDay, setCurrentDay] = useState<Day>(selectedDay as Day);

    const handleViewChange = (value: string) => {
        if (value) {
            setViewMode(value as ViewMode);
        }
    };

    const handleDayChange = (day: Day) => {
        setCurrentDay(day);
        if (viewMode !== "day") {
            setViewMode("day");
        }
    };

    const handleGoToNextPrevDay = (next: boolean) => {
        const currentIndex = days.indexOf(currentDay);
        const nextIndex = next
            ? currentIndex === days.length - 1
                ? 0
                : currentIndex + 1
            : currentIndex === 0
            ? days.length - 1
            : currentIndex - 1;
        setCurrentDay(days[nextIndex]);
    };

    return (
        <div
            className={cn(
                "space-y-4",
                viewMode === "week" && "overflow-x-auto"
            )}
        >
            <div className="flex items-center justify-end w-full">
                <div className="flex items-center space-x-4">
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={handleViewChange}
                    >
                        <ToggleGroupItem value="day" aria-label="Day view">
                            <Calendar className="h-4 w-4 mr-2" />
                            Day
                        </ToggleGroupItem>
                        <ToggleGroupItem value="week" aria-label="Week view">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Week
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            <div
                className={cn(
                    "flex bg-white dark:bg-gray-900 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 ",
                    viewMode === "week" && "min-w-[600px]"
                )}
            >
                <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                    {scheduleTimes.map((time) => (
                        <div
                            key={time}
                            style={{
                                height: CELL_HEIGHT,
                            }}
                            className="px-2 flex items-center justify-end text-sm text-gray-500 dark:text-gray-400 font-medium"
                        >
                            {formatTime(time)}
                        </div>
                    ))}
                </div>

                <div className="flex-1" ref={ref}>
                    <div
                        className={`grid ${
                            viewMode === "day" ? "grid-cols-1" : "grid-cols-6"
                        } border-b border-gray-200 dark:border-gray-700`}
                    >
                        {viewMode === "day" ? (
                            <div className="p-2 flex justify-between items-center">
                                <Select
                                    onValueChange={handleDayChange}
                                    value={currentDay}
                                >
                                    <SelectTrigger className="bg-transparent shadow-none dark:bg-transparent border-none w-min outline-none">
                                        <p className="font-semibold text-xl">
                                            {getDay(currentDay)}
                                        </p>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {days.map((day) => (
                                            <SelectItem
                                                key={day}
                                                value={day}
                                                onClick={() =>
                                                    handleDayChange(day)
                                                }
                                            >
                                                {getDay(day)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            handleGoToNextPrevDay(false)
                                        }
                                    >
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            handleGoToNextPrevDay(true)
                                        }
                                    >
                                        <ArrowRight className="h-6 w-6" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            days.map((day) => (
                                <div
                                    key={day}
                                    className="py-2 text-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={() => handleDayChange(day)}
                                >
                                    <p className="hidden lg:block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {getDay(day)}
                                    </p>

                                    <p className="block lg:hidden text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {day}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0">
                            <div
                                className={`grid ${
                                    viewMode === "day"
                                        ? "hidden"
                                        : "grid-cols-6"
                                } h-full`}
                            >
                                {Array.from({
                                    length: viewMode === "day" ? 1 : 6,
                                }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                                    />
                                ))}
                            </div>
                            <div className="grid grid-rows-9">
                                {scheduleTimes.map((time) => (
                                    <div
                                        key={time}
                                        style={{ height: CELL_HEIGHT }}
                                        className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                                    />
                                ))}
                            </div>
                        </div>
                        <div
                            style={{
                                gridTemplateRows: `repeat(${scheduleTimes.length},minmax(0,1fr))`,
                                gridTemplateColumns:
                                    viewMode === "day"
                                        ? "1fr"
                                        : "repeat(6, 1fr)",
                                gridAutoFlow: "row",
                            }}
                            className="grid relative"
                        >
                            <ScheduleContext.Provider
                                value={{ viewMode, setViewMode, currentDay }}
                            >
                                {children}
                            </ScheduleContext.Provider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
