"use client";

import type { InstructorData } from "@/lib/types";
import { BarChart, Book, ThumbsUp, User } from "lucide-react";
import { terms } from "@/lib/course-utils";
import Link from "next/link";
import { StarRating } from "./star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface InstructorCardProps {
    instructor: InstructorData;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
    const displayName = instructor.rateMyProfData
        ? `${instructor.rateMyProfData.firstName} ${instructor.rateMyProfData.lastName}`
        : instructor.name;

    return (
        <Card className="w-full h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-800">
            <CardHeader className="bg-primary/10">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <Link
                            href={`/instructors/${instructor.name}`}
                            className="hover:underline"
                        >
                            {displayName}
                        </Link>
                        <p className="text-sm font-normal text-muted-foreground mt-1">
                            {instructor.courseAndTerms.length}{" "}
                            {instructor.courseAndTerms.length === 1
                                ? "course"
                                : "courses"}
                        </p>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow space-y-4">
                {instructor.rateMyProfData &&
                    Number(instructor.rateMyProfData.overallRating) > 0 && (
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center">
                                <StarRating
                                    rating={Number(
                                        instructor.rateMyProfData.overallRating
                                    )}
                                />
                                <span className="text-sm ml-2 font-medium">
                                    {instructor.rateMyProfData.overallRating}/5
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {instructor.rateMyProfData.takeAgainRating !==
                                    "N/A" && (
                                    <div className="flex items-center">
                                        <ThumbsUp className="mr-2 h-4 w-4 text-green-500" />
                                        <span className="text-sm">
                                            {
                                                instructor.rateMyProfData
                                                    .takeAgainRating
                                            }{" "}
                                            would take again
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center">
                                    <BarChart className="mr-2 h-4 w-4 text-blue-500" />
                                    <span className="text-sm">
                                        Difficulty:{" "}
                                        {
                                            instructor.rateMyProfData
                                                .difficultyLevel
                                        }
                                        /5
                                    </span>
                                </div>

                                <div className="flex items-center">
                                    <Book className="mr-2 h-4 w-4 text-purple-500" />
                                    <span className="text-sm">
                                        {
                                            instructor.rateMyProfData
                                                .numberOfRatings
                                        }{" "}
                                        ratings
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                <div className="space-y-2">
                    <h4 className="font-semibold">Courses</h4>
                    {Object.entries(
                        instructor.courseAndTerms.reduce(
                            (acc, courseAndTerm) => {
                                const term = terms[courseAndTerm.term];
                                if (!acc[term]) {
                                    acc[term] = [];
                                }
                                acc[term].push(courseAndTerm.course);
                                return acc;
                            },
                            {} as Record<string, string[]>
                        )
                    ).map(([term, courses], index) => (
                        <div key={index} className="mb-2">
                            <h5 className="text-sm mb-2">{term}</h5>
                            <div className="flex items-center gap-1 flex-wrap">
                                {courses.map((course, courseIndex) => (
                                    <Link key={courseIndex} href={`/${course}`}>
                                        <Badge
                                            variant="outline"
                                            className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors px-2 py-1 dark:border-gray-700"
                                        >
                                            {course}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
