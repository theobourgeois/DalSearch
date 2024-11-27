import { CourseAndSubjectCode, courses, instructors, terms } from "@/utils/course";
import Link from "next/link";
import { Schedule } from "../_components/calendar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { Metadata } from "next";
import React from "react";
import { StarRating } from "../_components/start-rating";

type Props = {
  params: Promise<{ course: CourseAndSubjectCode }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseKey = (await params).course;
  const course = courses[courseKey];
  if (!course) {
    return {
      title: "Course not found",
      description: "The requested course could not be found.",
    };
  }

  return {
    title: `${course.subjectCode} ${course.courseCode} - ${course.title}`,
    description: course.description,
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
            <CardTitle className="text-2xl text-center text-red-600">Course Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              The course you're looking for doesn't exist. Please check the course code and try again.
            </p>
            <Link href="/" className="block mt-4 text-center text-blue-600 hover:underline">
              Return to Course Search
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const uniqueInstructors = [...new Set(Object.values(course.instructorsByTerm).flat())];

  return (
    <main className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-gray-900">
            {course.subjectCode} {course.courseCode} - {course.title}
          </CardTitle>
          <Badge variant="secondary" className="text-lg w-max">
            {course.creditHours} Credit Hours
          </Badge>
        </CardHeader>
        <CardContent>
          <article
            className="text-lg text-gray-700 leading-relaxed mb-6"
            dangerouslySetInnerHTML={{ __html: course.description }}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {course.prerequisites.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Prerequisites</h2>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq) => (
                    <Link key={prereq} href={`/${prereq}`}>
                      <Badge variant="outline" className="text-blue-600 hover:bg-blue-100 transition-colors p-2">
                        {prereq}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-2">
                {uniqueInstructors.length > 1 ? 'Instructors' : 'Instructor'}
              </h2>
              {Object.entries(course.instructorsByTerm).map(([term, instructorList]) => (
                <div key={term} className="mb-2">
                  <span className="font-medium">{terms[term]}: </span>
                  {instructorList.map((instructor) => {
                    return (
                      <Link key={instructor} href={`/instructors/${instructor}`}>
                        <Badge variant="outline" className="p-2 text-blue-600 hover:bg-blue-100 transition-colors">
                          {instructor}
                          {Number(instructors[instructor.trim()]?.overallRating) > 0 && (
                            <StarRating rating={Number(instructors[instructor.trim()].overallRating)} className="ml-2" />
                          )}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Course Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Schedule course={course} />
        </CardContent>
      </Card>
    </main>
  );
}
