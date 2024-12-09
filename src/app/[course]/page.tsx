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
            <main className="flex items-center justify-center h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center text-red-600">
                            Course Not Found
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-gray-600">
                            The course you&apos;re looking for doesn&apos;t
                            exist. Please check the course code and try again.
                        </p>
                        <Link
                            href="/"
                            className="block mt-4 text-center text-blue-600 hover:underline"
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
        <main className="container mx-auto px-4 pb-8 pt-4">
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(seoSchema),
                }}
            />
            <BackButton />
            <Card className="mb-8 mt-2">
                <CardHeader>
                    <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900">
                        {course.subjectCode} {course.courseCode} -{" "}
                        {course.title}
                    </CardTitle>
                    <div className="flex gap-2 ">
                        <Badge variant="secondary" className="text-lg w-max">
                            {course.creditHours} Credit Hours
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <article
                        className="text-lg text-gray-700 leading-relaxed mb-6"
                        dangerouslySetInnerHTML={{ __html: course.description }}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                        {course.prerequisites.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-2">
                                    Prerequisites
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {course.prerequisites.map((prereq) => (
                                        <Link key={prereq} href={`/${prereq}`}>
                                            <Badge
                                                variant="outline"
                                                className="text-blue-600 hover:bg-blue-100 transition-colors p-2"
                                            >
                                                {prereq}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-semibold mb-2">
                                {uniqueInstructors.length > 1
                                    ? "Instructors"
                                    : "Instructor"}
                            </h2>
                            {uniqueInstructors.length === 0 ? (
                                <p className="text-gray-600">TBA</p>
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

            <Card className="pb-8">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
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
