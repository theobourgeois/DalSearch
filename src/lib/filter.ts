import { offeredTerms } from "./course";
import { courseKey, getCourseFit } from "./schedule";
import type { ClassSession, CourseFilter, CourseListItem, CourseOrderBy } from "./types";

/** Empty lists mean "no restriction", so the default filter matches every course. */
export const defaultFilter: CourseFilter = {
    terms: [],
    courseLevels: [],
    subjectCodes: [],
    searchTerm: "",
    creditHours: [],
    scheduleFitOnly: false,
    scheduleBufferMinutes: 0,
};

export const defaultOrderBy: CourseOrderBy = { key: "title", direction: "asc" };

const allows = <T>(selected: T[], value: T) => selected.length === 0 || selected.includes(value);

/** Matches "csci 2122", "CSCI2122", "2122" or words from the title. */
export function matchesSearch(course: Pick<CourseListItem, "subjectCode" | "courseCode" | "title">, query: string) {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
        course.title.toLowerCase().includes(needle) ||
        courseKey(course).toLowerCase().includes(needle.replace(/\s+/g, ""))
    );
}

export function filterCourses<T extends CourseListItem>(
    courses: T[],
    filter: CourseFilter,
    scheduled: ClassSession[] = [],
): T[] {
    return courses.filter((course) => {
        const terms = offeredTerms(course).filter((term) => allows(filter.terms, term));
        if (terms.length === 0) return false;
        if (!allows(filter.courseLevels, `${course.courseCode[0]}000`)) return false;
        if (!allows(filter.subjectCodes, course.subjectCode)) return false;
        if (!allows(filter.creditHours, course.creditHours)) return false;
        if (!matchesSearch(course, filter.searchTerm)) return false;
        if (!filter.scheduleFitOnly) return true;

        return terms.some((term) => {
            const fit = getCourseFit(course, term, scheduled, filter.scheduleBufferMinutes);
            return fit.status === "fits" || fit.status === "scheduled";
        });
    });
}

const comparators: Record<CourseOrderBy["key"], (a: CourseListItem, b: CourseListItem) => number> = {
    courseCode: (a, b) => courseKey(a).localeCompare(courseKey(b)),
    title: (a, b) => a.title.localeCompare(b.title),
    creditHours: (a, b) => a.creditHours - b.creditHours,
    numClasses: (a, b) => a.termClasses.length - b.termClasses.length,
};

export function sortCourses<T extends CourseListItem>(courses: T[], orderBy: CourseOrderBy): T[] {
    const compare = comparators[orderBy.key];
    const direction = orderBy.direction === "asc" ? 1 : -1;
    return [...courses].sort((a, b) => compare(a, b) * direction);
}

export function getFilteredCourses<T extends CourseListItem>(
    courses: T[],
    filter: CourseFilter,
    orderBy: CourseOrderBy,
    limit: number,
    scheduled: ClassSession[] = [],
): T[] {
    return sortCourses(filterCourses(courses, filter, scheduled), orderBy).slice(0, limit);
}
