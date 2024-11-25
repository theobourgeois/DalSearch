import { CourseAndSubjectCode, courses } from "@/utils/course";

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
    <main>
      <section>
        <h1>
          {course.subjectCode} {course.courseCode} - {course.title}
        </h1>
        <p>{course.description}</p>
        {course.prerequisites.map((prereq) => (
          <p key={prereq}>{prereq}</p>
        ))}
      </section>
    </main>
  );
}
