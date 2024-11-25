import { CourseAndSubjectCode, courses, SubjectCode } from "./course";

export type CourseGraph = {
  [code: CourseAndSubjectCode]: {
    postreqs: CourseAndSubjectCode[];
    prereqs?: CourseAndSubjectCode[];
  }
}

export function createCourseGraph(subjectCode: SubjectCode) {
  const coursesBySubject = Object.values(courses).filter(
    (filter) => filter.subjectCode === subjectCode,
  );
  const courseKeys = coursesBySubject.map((course) => `${course.subjectCode}${course.courseCode}` as CourseAndSubjectCode);

  const graph = {}
  const i = coursesBySubject.length - 1;
  const course = coursesBySubject[i]!;
  const courseCode = `${course.subjectCode}${course.courseCode}` as CourseAndSubjectCode;
  courseGraphRecursive(courseCode, graph, courseKeys);
  return graph
}

function courseGraphRecursive(courseCode: CourseAndSubjectCode, graph: CourseGraph, courseKeys: CourseAndSubjectCode[]) {
  const prereqs = courses[courseCode].prerequisites;
  if (prereqs.length === 0) {
    const nextCourseIndex = courseKeys.indexOf(courseCode) - 1;
    const nextCourse = courseKeys[nextCourseIndex];

    if (nextCourse) {
      courseGraphRecursive(nextCourse, graph, courseKeys);
    }
    return;
  }

  for (const prereq of prereqs) {
    if (graph[prereq]) {
      if (!graph[prereq].postreqs.includes(courseCode)) {
        graph[prereq].postreqs.push(courseCode);
      }

    } else {
      graph[prereq] = {
        postreqs: [courseCode],
      }
    }
    courseGraphRecursive(prereq, graph, courseKeys);
  }
  graph[courseCode] = {
    postreqs: graph[courseCode] ? graph[courseCode].postreqs : [],
    prereqs: prereqs,
  }
}
