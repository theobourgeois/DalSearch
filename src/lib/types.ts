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
    /** Primary instructor first. Missing from schedules saved before instructors were stored per section. */
    instructors?: string[];
    /** The campus of its main room. Missing from schedules saved before rooms were stored. */
    campus?: string | null;
};

/** A physical room classes are held in. */
export type Room = {
    id: string;
    campus: string | null;
    /** "Goldberg Computer Science Bldg" */
    building: string;
    /** "Goldberg Computer Science Bldg 127" */
    name: string;
};

export type Enrollment = {
    enrolled: number;
    capacity: number;
};

type InstructorsByTerm = {
    [term: string]: string[];
};

export type Subject = {
    code: string;
    /** "Computer Science" */
    name: string;
};

export type Course = {
    prerequisites: CourseAndSubjectCode[];
    subjectCode: SubjectCode;
    courseCode: CourseCode;
    title: string;
    creditHours: number;
    /** Plain text. */
    description: string;
    termClasses: ClassSession[];
    /** Seats in the course's lectures (or its main kind of section) per term. */
    enrollmentByTerm: Record<Term, Enrollment>;
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
    "subjectCode" | "courseCode" | "title" | "creditHours" | "termClasses" | "enrollmentByTerm" | "instructorsByTerm"
>;

/** An instructor's RateMyProfessors profile, from the instructor_rating_by_name view. */
export type InstructorRating = {
    firstName: string;
    lastName: string;
    profileUrl: string | null;
    /** 1-5, null when nobody has rated them. */
    rating: number | null;
    difficulty: number | null;
    /** Percent, null when nobody answered. */
    wouldTakeAgain: number | null;
    ratingCount: number;
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
    /** As the exam schedule writes it: "1" for Lec 01 at Dal. */
    section: string;
    /** ISO timestamp. */
    startsAt: string;
};
