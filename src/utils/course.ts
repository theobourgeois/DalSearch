import searchData from "../../database/search.json"
import instructorsData from "../../database/ratemyprofessor.json";
import subjectsData from "../../database/subjects.json";
import examDateData from "../../database/exam_schedule.json";

type CapitalLetter = `${Uppercase<string>}`;
export type SubjectCode =
  `${CapitalLetter}${CapitalLetter}${CapitalLetter}${CapitalLetter}`;
export type CourseCode = `${number}${number}${number}${number}`;
export type CourseAndSubjectCode = `${SubjectCode}${CourseCode}`;
export type Time = `${number}${number}${number}${number}` | "C/D";
export type Day = (typeof days)[number];

export type TimeSlot = {
  start: Time; // Time in 24-hour format, e.g., "1005"
  end: Time; // Time in 24-hour format, e.g., "1125"
};

export type ClassSession = {
  term: Term; // Term code, e.g., "202520"
  section: string; // Section identifier, e.g., "T01"
  type: "Lec" | "Tut" | "Lab"; // Class type, e.g., Lecture or Tutorial
  days: Day[]; // Days of the week, e.g., ["M", "T", "R"]
  time: TimeSlot; // Start and end times
  location: string; // Classroom or location
  crn: string; // Course Registration Number
  course: CourseAndSubjectCode; // Course code, e.g., "MGMT2305"
};

type Enrollment = {
  enrolled: number; // Number of students enrolled
  capacity: number; // Maximum class capacity
};

type InstructorsByTerm = {
  [term: string]: string[]; // Term code mapping to a list of instructor names
};

export type Subject = {
  code: string;
  description: string;
};

export type Course = {
  prerequisites: CourseAndSubjectCode[]; // List of prerequisite course codes
  equivalent: string | null; // Equivalent course, if any
  subjectCode: SubjectCode; // Subject code, e.g., "MGMT"
  courseCode: CourseCode; // Course number, e.g., "2305"
  title: string; // Course title
  creditHours: number; // Number of credit hours
  description: string; // Course description
  termClasses: ClassSession[]; // Array of class sessions per term
  location: string; // Default location for the course
  enrollement: Enrollment; // Enrollment information
  instructorsByTerm: InstructorsByTerm; // Mapping of term codes to instructors
};

export type CourseByCode = Record<CourseAndSubjectCode, Course>;
export type Term = keyof typeof terms;
export type Instructor = {
  firstName: string;
  lastName: string;
  rateMyProfLink: string;
  overallRating: `${number}` | null;
  takeAgainRating: number;
  difficultyLevel: number;
  numberOfRatings: number;
};

export type InstructorsByName = Record<string, Instructor>;

export type CourseFilter = {
  terms: Term[];
  courseLevels: string[]; // 1000, 2000, 3000, 4000...
  subjectCodes: string[]; // CSCI, MATH, etc.
  searchTerm: string;
  creditHours: number[];
};

export type CourseOrderByKey =
  | "title"
  | "creditHours"
  | "numClasses"
  | "courseCode"

export type CourseOrderBy = {
  key: CourseOrderByKey;
  direction: "asc" | "desc";
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a JSON file
export const courses = searchData as CourseByCode;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a JSON file
export const instructors = instructorsData as InstructorsByName;
export const days = ["M", "T", "W", "R", "F", "S"] as const;
export const terms = {
  "202520": "2024/2025 Winter",
  "202530": "2024/2025 Summer",
  "202610": "2025/2026 Fall",
  "202620": "2025/2026 Winter",
} as const;

type ExamData = {
  section: string;
  date: string;
  time: string;
}

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
