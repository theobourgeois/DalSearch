import searchData from "./search.json";

type CapitalLetter = `${Uppercase<string>}`;
export type SubjectCode =
  `${CapitalLetter}${CapitalLetter}${CapitalLetter}${CapitalLetter}`;
export type CourseCode = `${number}${number}${number}${number}`;
export type CourseAndSubjectCode = `${SubjectCode}${CourseCode}`;
type TermCode = `${number}${number}${number}${number}${number}${number}`;
type Time = `${number}${number}${number}${number}`;
type Day = "M" | "T" | "W" | "R" | "F" | "S" | "U";

type TimeSlot = {
  start: Time; // Time in 24-hour format, e.g., "1005"
  end: Time; // Time in 24-hour format, e.g., "1125"
};

type ClassSession = {
  term: TermCode; // Term code, e.g., "202520"
  classes: CourseAndSubjectCode[]; // List of class IDs (if any)
  section: string; // Section identifier, e.g., "T01"
  type: "Lec" | "Tut" | "Lab"; // Class type, e.g., Lecture or Tutorial
  days: Day[]; // Days of the week, e.g., ["M", "T", "R"]
  time: TimeSlot; // Start and end times
  location: string; // Classroom or location
};

type Enrollment = {
  enrolled: number; // Number of students enrolled
  capacity: number; // Maximum class capacity
};

type InstructorsByTerm = {
  [term: string]: string[]; // Term code mapping to a list of instructor names
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - This is a JSON file
export const courses = searchData as CourseByCode;
