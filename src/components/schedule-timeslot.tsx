import { days, examDates } from "@/lib/course-utils";
import {
    CELL_HEIGHT,
    formatTime,
    getDay,
    ScheduleContext,
    scheduleTimes,
    TIME_QUANTUM_MIN,
} from "@/lib/schedule-utils";
import { CopyToClipboard } from "./ui/copy-to-clipboard";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { useContext } from "react";
import { ClassSession, Day } from "@/lib/types";

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

export function ScheduleTimeslot({
    day,
    termClass,
    termClasses,
    index,
    course,
    color,
}: {
    termClass: ClassSession;
    termClasses: ClassSession[];
    index: number;
    day: Day;
    course: string;
    color: string;
}) {
    const startRow = findClosestTimeSlotRow(termClass.time.start);
    const endRow = findClosestTimeSlotRow(termClass.time.end) + 1;
    const { viewMode, currentDay } = useContext(ScheduleContext);

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

    const examData = examDates[termClass.course]?.find(
        (data) => data.section === termClass.section.slice(1, 2)
    );

    const CourseContent = () => (
        <div className="p-2">
            <h3 className="font-bold mb-2">{termClass.course}</h3>
            <h3 className="font-bold mb-2">{termClass.section}</h3>
            <p className="text-sm mb-1">
                {dayName}, {formatTime(termClass.time.start)} -{" "}
                {formatTime(termClass.time.end)}
            </p>
            <p className="text-sm mb-2">{termClass.location}</p>
            <div className="flex flex-wrap gap-2">
                <p className="text-sm mb-2">CRN: {termClass.crn}</p>
                <CopyToClipboard text={termClass.crn} />
            </div>
            {examData && (
                <div>
                    <p className="text-md mb-2">Final Exam Date:</p>
                    <p className="text-sm mb-2">
                        {new Date(
                            examData.date + "T00:00:00"
                        ).toLocaleDateString()}{" "}
                        - {examData.time}
                    </p>
                </div>
            )}
        </div>
    );

    if (viewMode === "day" && currentDay !== day) {
        return null;
    }

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
                                    height: CELL_HEIGHT * (endRow - startRow),
                                    borderLeft: `6px solid ${color}`,
                                    gridRow: `${startRow} / ${endRow}`,
                                    gridColumn:
                                        viewMode === "day"
                                            ? "1 / -1"
                                            : `${dayIndex + 1} / ${
                                                  dayIndex + 1
                                              }`,
                                }}
                            >
                                <CardContent className="p-1 sm:p-2 h-full flex flex-col justify-between">
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
                                        <p className="font-bold text-xs sm:text-sm">
                                            {termClass.type} {termClass.section}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {dayName}
                                        </p>
                                    </div>
                                    <div className="text-xs">
                                        <p className="truncate">
                                            {formatTime(termClass.time.start)} -{" "}
                                            {formatTime(termClass.time.end)}
                                        </p>
                                        <p className="truncate">
                                            {termClass.location}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {termClass.type} {termClass.section} Details
                                </DialogTitle>
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
