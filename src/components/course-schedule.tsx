"use client";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { terms } from "@/lib/course-utils";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import React from "react";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { ScheduleTimeslot } from "./schedule-timeslot";
import { colors, getDay } from "@/lib/schedule-utils";
import { ScheduleBackground } from "./schedule-background";
import { Course, Term } from "@/lib/types";
import { CopyToClipboard } from "./ui/copy-to-clipboard";

export function CourseSchedule({ course }: { course: Course }) {
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

                        const isOnline = termClass.time.start === "C/D";

                        return (
                            <HoverCard key={id}>
                                <HoverCardTrigger asChild>
                                    <ToggleGroupItem
                                        value={id}
                                        className="px-3 py-2 rounded-md transition-colors duration-200 select-text"
                                        style={{
                                            backgroundColor: bgColor,
                                        }}
                                    >
                                        <span className="font-medium">
                                            {termClass.type} {termClass.section}
                                        </span>
                                        {isOnline && (
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
                                        <div className="flex flex-wrap gap-2">
                                            <p className="text-sm text-muted-foreground">
                                                CRN: {termClass.crn}
                                            </p>
                                            <CopyToClipboard
                                                text={termClass.crn}
                                            />
                                        </div>
                                        {!isOnline && (
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
                            <ScheduleTimeslot
                                key={termClass.section + day}
                                day={day}
                                termClass={termClass}
                                color={
                                    classColors[
                                        termClass.section + termClass.term
                                    ]
                                }
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
