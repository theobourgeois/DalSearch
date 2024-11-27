import React from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Book, ThumbsUp, BarChart } from 'lucide-react';
import { CourseAndSubjectCode, courses, Instructor } from '@/utils/course';
import { StarRating } from './start-rating';

interface InstructorListProps {
  instructorsByTerm: Record<string, string[]>;
  terms: Record<string, string>;
  instructors: Record<string, Instructor>;
}

export function InstructorList({ instructorsByTerm, terms, instructors }: InstructorListProps) {
  const courseKeys = Object.keys(courses) as CourseAndSubjectCode[];
  const instructorCourses = courseKeys.reduce((acc, courseKey) => {
    const course = courses[courseKey];
    const instructorInCurrentCourse = Object.values(instructorsByTerm).flat();
    Object.values(course.instructorsByTerm).flat().forEach((instructor) => {
      const trimmed = instructor.trim();
      if (instructorInCurrentCourse.includes(instructor)) {
        if (!acc[trimmed]) {
          acc[trimmed] = [];
        }
        acc[trimmed].push(courseKey);
      }
    });
    return acc;
  }, {} as Record<string, CourseAndSubjectCode[]>);

  return (
    <div>
      {Object.entries(instructorsByTerm).map(([term, instructorList]) => (
        <div key={term} className="mb-4">
          <h3 className="font-medium text-lg mb-2">{terms[term]}:</h3>
          <div className="flex flex-wrap gap-2">
            {instructorList.map((instructor) => {
              const instructorData = instructors[instructor.trim()];
              return (
                <HoverCard key={instructor}>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="p-2 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer">
                      {instructorData && (instructorData?.firstName + ' ' + instructorData?.lastName)}
                      {!instructorData && instructor}
                      {instructorData?.overallRating && (
                        <StarRating rating={Number(instructorData.overallRating)} className="ml-2" />
                      )}
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        {instructorData && (instructorData?.firstName + ' ' + instructorData?.lastName)}
                        {!instructorData && instructor}
                      </h4>
                      {instructorData && (
                        <>
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center">
                              <StarRating rating={Number(instructorData.overallRating)} />
                              <span className="text-sm ml-2">Overall</span>
                            </div>
                            <div className="flex items-center">
                              <ThumbsUp className="mr-2 h-4 w-4" />
                              <span className="text-sm">{instructorData.takeAgainRating} Would take again</span>
                            </div>
                            <div className="flex items-center">
                              <BarChart className="mr-2 h-4 w-4" />
                              <span className="text-sm">Difficulty: {instructorData.difficultyRating}/5</span>
                            </div>
                            <div className="flex items-center">
                              <Book className="mr-2 h-4 w-4" />
                              <span className="text-sm">{instructorData.numberOfRatings} Ratings</span>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="mt-2">
                        <h5 className="text-sm font-semibold mb-1">Courses:</h5>
                        <div className="flex flex-wrap gap-1">
                          {instructorCourses[instructor.trim()].map((course) => (
                            <Link key={course} href={`/${course}`}>
                              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary-hover">
                                {course}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                      {instructorData && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Rating information provided by <Link href="https://www.ratemyprofessors.com/">Rate My Professors</Link>
                        </p>)}


                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
