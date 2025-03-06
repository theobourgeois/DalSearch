import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Book, ThumbsUp, BarChart } from "lucide-react";
import { CourseAndSubjectCode, courses, Instructor } from "@/lib/course-utils";
import { StarRating } from "@/components/star-rating";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface InstructorListProps {
    instructorsByTerm: Record<string, string[]>;
    terms: Record<string, string>;
    instructors: Record<string, Instructor>;
}

export function InstructorList({
    instructorsByTerm,
    terms,
    instructors,
}: InstructorListProps) {
    const courseKeys = Object.keys(courses) as CourseAndSubjectCode[];
    const instructorCourses = courseKeys.reduce((acc, courseKey) => {
        const course = courses[courseKey];
        const instructorInCurrentCourse =
            Object.values(instructorsByTerm).flat();
        Object.values(course.instructorsByTerm)
            .flat()
            .forEach((instructor) => {
                const trimmed = instructor.trim();
                if (instructorInCurrentCourse.includes(instructor)) {
                    if (!acc[trimmed]) {
                        acc[trimmed] = [];
                    }
                    if (!acc[trimmed].includes(courseKey)) {
                        acc[trimmed].push(courseKey);
                    }
                }
            });
        return acc;
    }, {} as Record<string, CourseAndSubjectCode[]>);

    const InstructorContent = ({
        instructor,
        instructorData,
    }: {
        instructor: string;
        instructorData: Instructor | undefined;
    }) => (
        <div className="space-y-2 ">
            <h4 className="text-sm font-semibold">
                {instructorData ? (
                    <Link
                        className="hover:underline"
                        href={instructorData.rateMyProfLink}
                    >
                        {instructorData.firstName} {instructorData.lastName}
                    </Link>
                ) : (
                    instructor
                )}
            </h4>
            {instructorData && Number(instructorData.overallRating) > 0 && (
                <>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                            <StarRating
                                rating={Number(instructorData.overallRating)}
                            />
                            <span className="text-sm ml-2">Overall</span>
                        </div>
                        <div className="flex items-center">
                            <ThumbsUp className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                                {instructorData.takeAgainRating} Would take
                                again
                            </span>
                        </div>
                        <div className="flex items-center">
                            <BarChart className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                                Difficulty: {instructorData.difficultyLevel}/5
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Book className="mr-2 h-4 w-4" />
                            <span className="text-sm">
                                {instructorData.numberOfRatings} Ratings
                            </span>
                        </div>
                    </div>
                </>
            )}
            <div className="mt-2">
                <h5 className="text-sm font-semibold mb-1">Courses:</h5>
                <div className="flex flex-wrap gap-1">
                    {instructorCourses[instructor.trim()].map((course) => (
                        <Link key={course} href={`/${course}`}>
                            <Badge
                                variant="secondary"
                                className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors p-2 dark:border-gray-700"
                            >
                                {course}
                            </Badge>
                        </Link>
                    ))}
                </div>
            </div>
            {instructorData && Number(instructorData.overallRating) > 0 && (
                <p className="text-xs">
                    These ratings are from Rate My Professor and may not reflect
                    your future experience. Use your discretion to assess the
                    reviews&apos; quality
                </p>
            )}
        </div>
    );

    return (
        <div>
            {Object.entries(instructorsByTerm).map(([term, instructorList]) => (
                <div key={term} className="mb-4">
                    <h3 className="font-medium text-lg mb-2">{terms[term]}:</h3>
                    <div className="flex flex-wrap gap-2">
                        {instructorList.map((instructor) => {
                            const instructorData =
                                instructors[instructor.trim()];
                            return (
                                <Popover key={instructor}>
                                    <HoverCard>
                                        <PopoverTrigger asChild>
                                            <HoverCardTrigger asChild>
                                                <Badge
                                                    variant="outline"
                                                    className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors p-2 dark:border-gray-700"
                                                >
                                                    {instructorData
                                                        ? `${instructorData.firstName} ${instructorData.lastName}`
                                                        : instructor}
                                                    {instructorData?.overallRating &&
                                                        Number(
                                                            instructorData?.overallRating ||
                                                                ""
                                                        ) > 0 && (
                                                            <StarRating
                                                                rating={Number(
                                                                    instructorData.overallRating
                                                                )}
                                                                className="ml-2"
                                                            />
                                                        )}
                                                </Badge>
                                            </HoverCardTrigger>
                                        </PopoverTrigger>
                                        <HoverCardContent className="w-80 bg-white">
                                            <InstructorContent
                                                instructor={instructor}
                                                instructorData={instructorData}
                                            />
                                        </HoverCardContent>
                                        <PopoverContent className="w-80 bg-white">
                                            <InstructorContent
                                                instructor={instructor}
                                                instructorData={instructorData}
                                            />
                                        </PopoverContent>
                                    </HoverCard>
                                </Popover>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
