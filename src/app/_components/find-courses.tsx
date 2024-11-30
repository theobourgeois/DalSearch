"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectItem,
    SelectContent,
    SelectTrigger,
} from "@/components/ui/select";
import { Course, Term, terms } from "@/utils/course";
import { useState } from "react";

type CourseFilter = {
    term: Term;
    courseLevel?: number; // 1000, 2000, 3000, 4000...
    subjectCode?: string; // CSCI, MATH, etc.
    courseCode?: string; // 1105, 2202, etc.
    instructor?: string; // Instructor name
    day?: string; // M, T, W, R, F, S
    time?: string; // 08:30, 10:00, etc.
    location?: string; // Classroom or building
    crn?: string; // Course Registration Number
    keyword: string; // Search keyword
};

export function FindCourses({ courses }: { courses: Course[] }) {
    const [filter, setFilter] = useState<CourseFilter>({
        term: "202520",
        courseLevel: undefined,
        subjectCode: undefined,
        courseCode: undefined,
        instructor: undefined,
        day: undefined,
        time: undefined,
        location: undefined,
        crn: undefined,
        keyword: "",
    });

    return (
        <div>
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Find Courses</h2>
                </CardHeader>
                <CardContent>
                    <Label>Term</Label>
                    <Select>
                        <SelectTrigger>{terms[filter.term]}</SelectTrigger>
                        <SelectContent>
                            {Object.keys(terms).map((term) => (
                                <SelectItem key={term} value={term}>
                                    {terms[term]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        </div>
    );
}
