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
import { RecommendationInput } from "./recommendations-input";

const ALL_OPTIONS = "All";
const courseLevelNums = 9;

type CourseFilter = {
    term: Term | "All";
    courseLevel?: string; // 1000, 2000, 3000, 4000...
    subjectCode?: string; // CSCI, MATH, etc.
    instructor?: string; // Instructor name
    location?: string; // Classroom or building
    keyword: string; // Search keyword
};

export function FindCourses({ courses }: { courses: Course[] }) {
    const [filter, setFilter] = useState<CourseFilter>({
        term: ALL_OPTIONS,
        courseLevel: ALL_OPTIONS,
        subjectCode: undefined,
        instructor: undefined,
        location: undefined,
        keyword: "",
    });

    const handleFilterChange = (key: keyof CourseFilter) => (value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div>
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold">Filter</h2>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            <Label>Term</Label>
                            <Select
                                value={filter.term}
                                onValueChange={handleFilterChange("term")}
                            >
                                <SelectTrigger>
                                    {filter.term === ALL_OPTIONS
                                        ? "All Terms"
                                        : terms[filter.term]}
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(terms).map((term) => (
                                        <SelectItem key={term} value={term}>
                                            {terms[term]}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={ALL_OPTIONS}>
                                        All Terms
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Course Level</Label>
                            <Select
                                value={filter.courseLevel}
                                onValueChange={handleFilterChange(
                                    "courseLevel"
                                )}
                            >
                                <SelectTrigger>
                                    {filter.courseLevel === ALL_OPTIONS
                                        ? "All Levels"
                                        : filter.courseLevel}
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from(
                                        { length: courseLevelNums },
                                        (_, i) => i + 1
                                    ).map((level) => (
                                        <SelectItem
                                            key={level}
                                            value={(level * 1000).toString()}
                                        >
                                            {level * 1000}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={ALL_OPTIONS}>
                                        All Levels
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Subject Code</Label>
                            <RecommendationInput
                                allItems={Array.from(
                                    new Set(
                                        courses.map(
                                            (course) => course.subjectCode
                                        )
                                    )
                                )}
                                numOfRecommendations={null}
                                onSelect={handleFilterChange("subjectCode")}
                            />
                        </div>
                        <div>
                            <Label>Instructor</Label>
                            <RecommendationInput
                                allItems={Array.from(
                                    new Set(
                                        courses
                                            .map((course) =>
                                                Object.values(
                                                    course.instructorsByTerm
                                                ).flat()
                                            )
                                            .flat()
                                    )
                                )}
                                numOfRecommendations={15}
                                onSelect={handleFilterChange("instructor")}
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <RecommendationInput
                                allItems={
                                    Array.from(
                                        new Set(
                                            courses.map((course) =>
                                                course.location
                                                    .split(" ")
                                                    .join(" ")
                                            )
                                        )
                                    ) as string[]
                                }
                                numOfRecommendations={15}
                                onSelect={handleFilterChange("instructor")}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
