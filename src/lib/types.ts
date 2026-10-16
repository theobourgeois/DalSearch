import type { days, Term } from "./constants";
import type { RatingSummary } from "./instructors";

export type { Term } from "./constants";

type CapitalLetter = `${Uppercase<string>}`;
export type SubjectCode = `${CapitalLetter}${CapitalLetter}${CapitalLetter}${CapitalLetter}`;
export type CourseCode = `${number}${number}${number}${number}`;
/** A course key such as "CSCI2122". */
export type CourseAndSubjectCode = `${SubjectCode}${CourseCode}`;
/** A 24-hour time such as "1005", or "C/D" for classes without a set time. */
export type Time = `${number}${number}${number}${number}` | "C/D";
export type Day = (typeof days)[number];

export type TimeSlot = {
    start: Time;
    end: Time;
};

/** "Lec", "Lab", "Tut", plus rarer types such as "WkT" (work term) or "Ths" (thesis). */
export type SessionType = string;

export type ClassSession = {
    term: Term;
    section: string;
    type: SessionType;
    days: Day[];
    time: TimeSlot;
    location: string;
    crn: string;
    course: CourseAndSubjectCode;
};

type Enrollment = {
    enrolled: number;
    capacity: number;
};

type InstructorsByTerm = {
    [term: string]: string[];
};

export type Subject = {
    code: string;
    description: string;
};

export type Course = {
    prerequisites: CourseAndSubjectCode[];
    equivalent: string | null;
    subjectCode: SubjectCode;
    courseCode: CourseCode;
    title: string;
    creditHours: number;
    description: string;
    termClasses: ClassSession[];
    location: string;
    enrollement: Enrollment;
    instructorsByTerm: InstructorsByTerm;
};

export type CourseByCode = Record<CourseAndSubjectCode, Course>;

/** The lightweight per-course record shipped to the browser for search and lookups. */
export type CourseSummary = {
    code: CourseAndSubjectCode;
    title: string;
    creditHours: number;
};

/** The subset of a course needed to list it and work out whether it fits a schedule. */
export type CourseListItem = Pick<
    Course,
    "subjectCode" | "courseCode" | "title" | "creditHours" | "termClasses" | "enrollement" | "instructorsByTerm"
>;

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
        term: Term;
        course: CourseAndSubjectCode;
    }[];
};

/** An instructor as listed on the Instructors page. */
export type InstructorListItem = RatingSummary & {
    subjects: string[];
    /** The first term from now that they teach in, with their courses that term. */
    teaching: { term: Term; courses: CourseAndSubjectCode[] } | null;
    courseCount: number;
};

export type CourseFilter = {
    terms: Term[];
    /** An empty list means every level. */
    courseLevels: string[];
    /** An empty list means every subject. */
    subjectCodes: string[];
    searchTerm: string;
    /** An empty list means any credit hours. */
    creditHours: number[];
    scheduleFitOnly: boolean;
    scheduleBufferMinutes: ScheduleBufferMinutes;
};

export type ScheduleBufferMinutes = 0 | 5 | 10 | 15 | 30;

export type CourseOrderByKey = "title" | "creditHours" | "numClasses" | "courseCode";

export type CourseOrderBy = {
    key: CourseOrderByKey;
    direction: "asc" | "desc";
};

export type ExamData = {
    section: string;
    date: string;
    time: string;
};
