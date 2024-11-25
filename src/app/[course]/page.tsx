import { CourseAndSubjectCode, courses } from "@/utils/course";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Schedule } from "../_components/calendar";

const semesters = [
  {
    value: "202510",
    label: "2024/2025 Fall"
  },
  {
    value: "202520",
    label: "2024/2025 Winter"
  }
]

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
  console.log(course)

  return (
    <main className="p-12 flex flex-col justify-center items-center">
      <section className="flex-col flex gap-2 w-3/4">
        <h2 className="text-5xl font-bold">
          {course.subjectCode} {course.courseCode} - {course.title}
        </h2>
        <p>{course.description}</p>
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
        <ToggleGroup type="single">
          {semesters.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Schedule schedule={course.termClasses} />


      </section>
    </main>
  );
}
