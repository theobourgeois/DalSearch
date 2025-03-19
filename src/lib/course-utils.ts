import searchData from "../../database/search.json"
import instructorsData from "../../database/ratemyprofessor.json";
import subjectsData from "../../database/subjects.json";
import examDateData from "../../database/exam_schedule.json";
import { Term, ExamData, Subject, CourseFilter, CourseOrderBy, Course, CourseByCode, RateMyProfInstructorsByName, CourseAndSubjectCode, InstructorData } from "./types";
import { GraphNode } from "@/components/graph/graph";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a JSON file
export const courses = searchData as CourseByCode;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a JSON file
export const instructors = instructorsData as RateMyProfInstructorsByName;
export const days = ["M", "T", "W", "R", "F", "S"] as const;
export const terms = {
  "202520": "2024/2025 Winter",
  "202530": "2024/2025 Summer",
  "202610": "2025/2026 Fall",
  "202620": "2025/2026 Winter",
} as const;

export const currentTerm: Term = "202520"

export const examDates = examDateData as Record<string, ExamData[]>;

export const subjects = subjectsData as Subject[];
export const creditHours = Array.from(new Set(Object.values(courses).map((course) => Number(course.creditHours)))).sort((a, b) => a - b);

const NUM_COURSE_LEVELS = 9;
const ALL_COURSE_LEVELS = Array.from({ length: NUM_COURSE_LEVELS }, (_, i) =>
  ((i + 1) * 1000).toString()
);

export const defaultFilter: CourseFilter = {
  terms: Object.keys(terms) as Term[],
  courseLevels: ALL_COURSE_LEVELS,
  subjectCodes: subjects.map((subject) => subject.code),
  searchTerm: "",
  creditHours,
};

export const defaultOrderBy: CourseOrderBy = {
  key: "title",
  direction: "asc",
};



export function getAllInstructors(): InstructorData[] {
  const instructorsMap: Record<string, InstructorData> = {}

  for (const course of Object.values(courses)) {
    for (const [term, instructorsList] of Object.entries(course.instructorsByTerm)) {
      for (const instructor of instructorsList) {
        if (instructor === "Staff") {
          continue
        }
        if (!instructorsMap[instructor]) {
          instructorsMap[instructor] = {
            name: instructor,
            rateMyProfData: instructors[instructor.trim()] ?? null,
            courseAndTerms: []
          }
        }
        const courseDoesNotExistsYet = !instructorsMap[instructor].courseAndTerms.some((courseAndTerm) => courseAndTerm.term === term as Term && courseAndTerm.course === course.subjectCode + course.courseCode as CourseAndSubjectCode)
        if (courseDoesNotExistsYet)
          instructorsMap[instructor].courseAndTerms.push({
            term: term as Term,
            course: course.subjectCode + course.courseCode as CourseAndSubjectCode
          })
      }

    }
  }

  return Object.values(instructorsMap)
}

export function getFilteredCourses(
  courses: Course[],
  filter: CourseFilter,
  orderBy: CourseOrderBy,
  maxNumCourses: number
) {
  const keywordFilteredCourses = courses.filter((course) => {
    const keyword = filter.searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(keyword) ||
      course.subjectCode.toLowerCase().includes(keyword) ||
      course.courseCode.toLowerCase().includes(keyword)
    );
  });

  const filteredCourses = keywordFilteredCourses.filter((course) => {
    const hasSelectedTerm = course.termClasses.some((termClass) => {
      return filter.terms.includes(termClass.term);
    });
    const hasSelectedCourseLevel = filter.courseLevels.includes(
      course.courseCode[0] + "000"
    );
    const hasSelectedSubjectCode = filter.subjectCodes.includes(
      course.subjectCode
    );
    const hasSelectedCreditHours = filter.creditHours.includes(
      course.creditHours
    );
    return (
      hasSelectedTerm &&
      hasSelectedCourseLevel &&
      hasSelectedCreditHours &&
      hasSelectedSubjectCode
    );
  });

  switch (orderBy.key) {
    case "courseCode":
      if (orderBy.direction === "asc") {
        filteredCourses.sort((a, b) =>
          (a.subjectCode + a.subjectCode).localeCompare(
            b.subjectCode + b.subjectCode
          )
        );
      } else {
        filteredCourses.sort((a, b) =>
          (b.subjectCode + b.subjectCode).localeCompare(
            a.subjectCode + a.subjectCode
          )
        );
      }
      break;
    case "title":
      if (orderBy.direction === "asc") {
        filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        filteredCourses.sort((a, b) => b.title.localeCompare(a.title));
      }
      break;
    case "creditHours":
      if (orderBy.direction === "asc") {
        filteredCourses.sort((a, b) => a.creditHours - b.creditHours);
      } else {
        filteredCourses.sort((a, b) => b.creditHours - a.creditHours);
      }
      break;
    case "numClasses":
      if (orderBy.direction === "asc") {
        filteredCourses.sort(
          (a, b) => a.termClasses.length - b.termClasses.length
        );
      } else {
        filteredCourses.sort(
          (a, b) => a.termClasses.length - b.termClasses.length
        );
      }
      break;
  }

  return filteredCourses.slice(0, maxNumCourses);
}


export function getPrerequisitesGraph() {
  const nodes: Record<string, GraphNode> = {}

  for (const course of Object.values(courses)) {
    nodes[course.subjectCode + course.courseCode] = {
      label: course.subjectCode + course.courseCode,
      children: course.prerequisites.map((prerequisite) => prerequisite)
    }
  }

  return nodes
}

function recur(
  root: string,
  nodes: Record<string, GraphNode>,
  allNodes: string[]
) {
  const node = nodes[root];
  if (!node) {
    return;
  }

  allNodes.push(root);

  for (const child of node.children) {
    recur(child, nodes, allNodes);
  }
}

export function getCourseGraphData(courseCode: string) {
  const nodes = getPrerequisitesGraph();
  const allNodes: string[] = [];
  recur(courseCode, nodes, allNodes);

  const newNodes: Record<string, GraphNode> = {};
  for (const node of allNodes) {
    newNodes[node] = nodes[node];
  }

  return {
    root: nodes[courseCode],
    nodes: newNodes,
  };
}
