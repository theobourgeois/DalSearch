import { days, terms } from "./course-utils";

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
export type RateMyProfInstructorData = {
  firstName: string;
  lastName: string;
  rateMyProfLink: string;
  overallRating: `${number}` | null;
  takeAgainRating: string;
  difficultyLevel: number;
  numberOfRatings: number;
};

export type RateMyProfInstructorsByName = Record<string, RateMyProfInstructorData>;

export type InstructorData = {
  name: string;
  rateMyProfData: RateMyProfInstructorData | null;
  courseAndTerms: {
    term: Term,
    course: CourseAndSubjectCode
  }[]
}

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

export type ExamData = {
  section: string;
  date: string;
  time: string;
}