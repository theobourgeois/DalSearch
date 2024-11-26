import { CourseAndSubjectCode, courses } from "@/utils/course";
import Link from "next/link";
import { Schedule } from "../_components/calendar";


export default async function Page({
  params,
}: {
  params: Promise<{ course: CourseAndSubjectCode }>;
}) {
  const courseKey = (await params).course;
  const course = courses[courseKey];
  if (!course) {
    return <h1>Course not found</h1>;
  }

  return (
    <main className="p-12 flex flex-col justify-center items-center">
      <section className="flex-col flex gap-2 w-3/4">
        <h2 className="text-5xl font-bold">
          {course.subjectCode} {course.courseCode} - {course.title}
        </h2>
        <p dangerouslySetInnerHTML={{ __html: course.description }} />
        <div>
          {course.prerequisites.length > 0 && (
            <p className="text-xl font-medium">
              Prerequisites:{" "}
              {course.prerequisites.map((prereq, index) => (
                <Link className="font-bold" key={prereq} href={`/${prereq}`}>
                  {prereq}{index < course.prerequisites.length - 1 ? ", " : ""}
                </Link>
              ))}
            </p>
          )}
          <p className="font-medium text-xl">
            Credit Hours: {course.creditHours}
          </p>
        </div>


      </section>
      <section className="flex-col flex gap-2 w-3/4 mt-8">
        <h2 className="text-4xl font-bold">Schedule</h2>
        <Schedule course={course} />
      </section>
    </main>
  );
}
