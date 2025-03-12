"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassSession, CourseAndSubjectCode, CourseByCode } from "@/lib/types";

type SelectedCourse = {
    code: CourseAndSubjectCode;
    selectedClasses: {
        [key in "Lec" | "Tut" | "Lab"]?: string;
    };
};

export function CourseSelector({ courses }: { courses: CourseByCode }) {
    const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>(
        []
    );

    const handleAddCourse = (courseCode: CourseAndSubjectCode) => {
        if (!selectedCourses.some((course) => course.code === courseCode)) {
            setSelectedCourses([
                ...selectedCourses,
                { code: courseCode, selectedClasses: {} },
            ]);
        }
    };

    const handleRemoveCourse = (courseCode: CourseAndSubjectCode) => {
        setSelectedCourses(
            selectedCourses.filter((course) => course.code !== courseCode)
        );
    };

    const handleUpdateClass = (
        courseCode: CourseAndSubjectCode,
        type: "Lec" | "Tut" | "Lab",
        section: string
    ) => {
        setSelectedCourses(
            selectedCourses.map((course) =>
                course.code === courseCode
                    ? {
                          ...course,
                          selectedClasses: {
                              ...course.selectedClasses,
                              [type]: section,
                          },
                      }
                    : course
            )
        );
    };

    const getAvailableClasses = (
        courseCode: CourseAndSubjectCode,
        type: "Lec" | "Tut" | "Lab"
    ): ClassSession[] => {
        return courses[courseCode].termClasses.filter(
            (session) => session.type === type
        );
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <h2 className="text-2xl font-bold">Course Selector</h2>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                    {Object.entries(courses).map(([code, course]) => (
                        <div key={code} className="mb-4 p-4 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">
                                    {code} - {course.title}
                                </h3>
                                {selectedCourses.some(
                                    (c) => c.code === code
                                ) ? (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            handleRemoveCourse(
                                                code as CourseAndSubjectCode
                                            )
                                        }
                                    >
                                        Remove Course
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleAddCourse(
                                                code as CourseAndSubjectCode
                                            )
                                        }
                                    >
                                        Add Course
                                    </Button>
                                )}
                            </div>
                            {selectedCourses.some((c) => c.code === code) && (
                                <div className="mt-2 space-y-2">
                                    {(["Lec", "Tut", "Lab"] as const).map(
                                        (type) => {
                                            const availableClasses =
                                                getAvailableClasses(
                                                    code as CourseAndSubjectCode,
                                                    type
                                                );
                                            if (availableClasses.length === 0)
                                                return null;
                                            return (
                                                <div
                                                    key={`${code}-${type}`}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <span className="w-12 text-sm font-medium">
                                                        {type}:
                                                    </span>
                                                    <Select
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            handleUpdateClass(
                                                                code as CourseAndSubjectCode,
                                                                type,
                                                                value
                                                            )
                                                        }
                                                        value={
                                                            selectedCourses.find(
                                                                (c) =>
                                                                    c.code ===
                                                                    code
                                                            )?.selectedClasses[
                                                                type
                                                            ] || ""
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue
                                                                placeholder={`Select ${type}`}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableClasses.map(
                                                                (session) => (
                                                                    <SelectItem
                                                                        key={`${code}-${type}-${session.section}`}
                                                                        value={
                                                                            session.section
                                                                        }
                                                                    >
                                                                        {
                                                                            session.section
                                                                        }{" "}
                                                                        -{" "}
                                                                        {session.days.join(
                                                                            ", "
                                                                        )}{" "}
                                                                        {
                                                                            session
                                                                                .time
                                                                                .start
                                                                        }
                                                                        -
                                                                        {
                                                                            session
                                                                                .time
                                                                                .end
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
