type CapitalLetter = `${Uppercase<string>}`
type SubjectCode = `${CapitalLetter}${CapitalLetter}${CapitalLetter}${CapitalLetter}`
type CourseCode = `${number}${number}${number}${number}`

type TimeSlot = {
  start: string; // Time in 24-hour format, e.g., "1005"
  end: string;   // Time in 24-hour format, e.g., "1125"
};

type ClassSession = {
  term: string;            // Term code, e.g., "202520"
  classes: string[];       // List of class IDs (if any)
  section: string;         // Section identifier, e.g., "T01"
  type: "Lec" | "Tut" | "Lab";     // Class type, e.g., Lecture or Tutorial
  days: string[];          // Days of the week, e.g., ["M", "T", "R"]
  time: TimeSlot;          // Start and end times
  location: string;        // Classroom or location
};

type Enrollment = {
  enrolled: number; // Number of students enrolled
  capacity: number; // Maximum class capacity
};

type InstructorsByTerm = {
  [term: string]: string[]; // Term code mapping to a list of instructor names
};

export type Course = {
  prerequisites: string[];        // List of prerequisite course codes
  equivalent: string | null;      // Equivalent course, if any
  subjectCode: SubjectCode;            // Subject code, e.g., "MGMT"
  courseCode: CourseCode;             // Course number, e.g., "2305"
  title: string;                  // Course title
  creditHours: number;            // Number of credit hours
  description: string;            // Course description
  termClasses: ClassSession[];    // Array of class sessions per term
  location: string;               // Default location for the course
  enrollement: Enrollment;        // Enrollment information
  instructorsByTerm: InstructorsByTerm; // Mapping of term codes to instructors
};
