import {
    CourseAndSubjectCode,
    courses,
    instructors,
    terms,
} from "@/utils/course";
import Link from "next/link";
import { Schedule } from "../../components/schedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import React from "react";
import Script from "next/script";
import { BackButton } from "@/components/back-button";
import { InstructorList } from "@/components/instructor-list";
import { RecentSearchHandler } from "@/components/recent-searches";

type Props = {
    params: Promise<{ course: CourseAndSubjectCode }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const courseKey = (await params).course;
    const course = courses[courseKey];
    if (course) {
        return {
            title: `${course.subjectCode} ${course.courseCode} - ${course.title} - Dalhousie University`,
            description: course.description,
            keywords: [
                course.subjectCode,
                course.courseCode,
                course.title,
                ...course.prerequisites,
                "Dalhousie University",
                "dalsearch",
                "Halifax",
                "dal search",
                "Nova Scotia",
                "dal",
                "search",
            ],
        };
    }

    return {
        title: "Course Not Found - Dalhousie University",
        description:
            "The course you're looking for doesn't exist. Please check the course code and try again.",
        keywords: [
            "Dalhousie University",
            "dalsearch",
            "Halifax",
            "dal search",
            "Nova Scotia",
            "dal",
            "search",
        ],
    };
}

export default async function CoursePage({
    params,
}: {
    params: Promise<{ course: CourseAndSubjectCode }>;
}) {
    const courseKey = (await params).course;
    const course = courses[courseKey];

    if (!course) {
        return (
            <main className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center text-red-600 dark:text-red-500">
                            Course Not Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            The course you&apos;re looking for doesn&apos;t
                            exist. Please check the course code and try again.
                        </p>
                        <Link
                            href="/"
                            className="block mt-4 text-center text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Return to Course Search
                        </Link>
                    </CardContent>
                </Card>
            </main>
        );
    }

    const uniqueInstructors = [
        ...new Set(Object.values(course.instructorsByTerm).flat()),
    ].filter((i) => i !== "Staff");
    const filteredInstructorsByTerm = Object.entries(
        course.instructorsByTerm
    ).reduce((acc, [term, instructors]) => {
        const filtered = instructors.filter((i) => i !== "Staff");
        const removedDuplicates = [...new Set(filtered)];
        if (removedDuplicates.length > 0) {
            acc[term] = removedDuplicates;
        }

        return acc;
    }, {} as Record<string, string[]>);

    // for SEO
    const seoSchema = {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.subjectCode + course.courseCode,
        description: course.description,
        provider: {
            "@type": "Organization",
            name: "DalSearch",
            url: "https://dalsearch.com",
        },
    };

    return (
        <main className="container mx-auto px-4 pb-8 pt-4 bg-white dark:bg-gray-900">
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(seoSchema),
                }}
            />
            <RecentSearchHandler
                recentCourse={{
                    subjectCode: course.subjectCode,
                    courseCode: course.courseCode,
                    title: course.title,
                }}
            />
            <BackButton />
            <Card className="mb-8 mt-2 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {course.subjectCode} {course.courseCode} -{" "}
                        {course.title}
                    </CardTitle>
                    <div className="flex gap-2 ">
                        <Badge
                            variant="secondary"
                            className="text-lg w-max dark:bg-gray-700 dark:text-gray-300"
                        >
                            {course.creditHours} Credit Hours
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <article
                        className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                        {course.prerequisites.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                    Prerequisites
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {course.prerequisites.map((prereq) => (
                                        <Link key={prereq} href={`/${prereq}`}>
                                            <Badge
                                                variant="outline"
                                                className="text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors p-2 dark:border-gray-700"
                                            >
                                                {prereq}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                {uniqueInstructors.length > 1
                                    ? "Instructors"
                                    : "Instructor"}
                            </h2>
                            {uniqueInstructors.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-400">
                                    TBA
                                </p>
                            ) : (
                                <InstructorList
                                    instructorsByTerm={
                                        filteredInstructorsByTerm
                                    }
                                    terms={terms}
                                    instructors={instructors}
                                />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="pb-8 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Course Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Schedule course={course} />
                </CardContent>
            </Card>
        </main>
    );
}
