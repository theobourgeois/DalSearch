"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import Fuse from "fuse.js";
import {
    Course,
    CourseFilter,
    CourseOrderBy,
    subjects,
    Term,
    terms,
} from "@/utils/course";
import { CourseCard } from "./course-card";
import { CourseFilterDrawer } from "./course-filter-drawer";
import { useStoredState } from "@/hooks/use-stored-state";
import { OrderByCourses } from "./order-courses";

const NUM_COURSE_LEVELS = 9;
const ALL_COURSE_LEVELS = Array.from({ length: NUM_COURSE_LEVELS }, (_, i) =>
    ((i + 1) * 1000).toString()
);
const MAX_NUM_COURSES = 10;

export function ExploreCourses({ courses }: { courses: Course[] }) {
    const [maxNumCourses, setMaxNumCourses] = useState(MAX_NUM_COURSES);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [filter, setFilter] = useStoredState<CourseFilter>(
        {
            terms: Object.keys(terms) as Term[],
            courseLevels: ALL_COURSE_LEVELS,
            subjectCodes: subjects.map((subject) => subject.code),
            searchTerm: "",
        },
        "filter"
    );
    const [orderBy, setOrderBy] = useStoredState<CourseOrderBy>(
        {
            key: "title",
            direction: "asc",
        },
        "orderBy"
    );

    const fuse = useMemo(() => {
        return new Fuse(courses, {
            includeScore: true,
            keys: ["subjectCode", "courseCode", "title"],
        });
    }, [courses]);

    const debouncedFilter = useDebounce(filter, 300);

    const filteredCourses = useMemo(() => {
        const filter = debouncedFilter;
        const fuzzySearchedCourses = filter.searchTerm
            ? fuse.search(filter.searchTerm).map((result) => result.item)
            : courses;
        const filteredCourses = fuzzySearchedCourses.filter((course) => {
            const hasSelectedTerm = course.termClasses.some((termClass) => {
                return filter.terms.includes(termClass.term);
            });
            const hasSelectedCourseLevel = filter.courseLevels.includes(
                course.courseCode[0] + "000"
            );
            const hasSelectedSubjectCode = filter.subjectCodes.includes(
                course.subjectCode
            );
            return (
                hasSelectedTerm &&
                hasSelectedCourseLevel &&
                hasSelectedSubjectCode
            );
        });

        // order by

        switch (orderBy.key) {
            case "title":
                if (orderBy.direction === "asc") {
                    filteredCourses.sort((a, b) =>
                        a.title.localeCompare(b.title)
                    );
                } else {
                    filteredCourses.sort((a, b) =>
                        a.title.localeCompare(b.title)
                    );
                }
                break;
            case "creditHours":
                if (orderBy.direction === "asc") {
                    filteredCourses.sort(
                        (a, b) => a.creditHours - b.creditHours
                    );
                } else {
                    filteredCourses.sort(
                        (a, b) => b.creditHours - a.creditHours
                    );
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
    }, [courses, debouncedFilter, fuse, maxNumCourses, orderBy]);

    const handleSearchTermChange = (searchTerm: string) => {
        setFilter((prev) => ({
            ...prev,
            searchTerm,
        }));
    };

    const handleFilterUpdate = (newFilter: Partial<CourseFilter>) => {
        const updatedFilter = { ...filter, ...newFilter };
        setFilter(updatedFilter);
    };

    const handleShowMoreCourses = () => {
        setMaxNumCourses((prev) => prev + MAX_NUM_COURSES);
    };

    const handleChangeOrderBy = (orderBy: CourseOrderBy) => {
        setOrderBy(orderBy);
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        className="pl-10 w-full rounded-full"
                        value={filter.searchTerm}
                        onChange={(e) => handleSearchTermChange(e.target.value)}
                        placeholder="Search for course name, code, or subject code"
                    />
                </div>
                <OrderByCourses
                    orderBy={orderBy}
                    onOrderByChange={handleChangeOrderBy}
                />
                <CourseFilterDrawer
                    filter={filter}
                    onFilterUpdate={handleFilterUpdate}
                    isOpen={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                />
            </div>

            <div className="flex flex-col gap-4">
                {filteredCourses.map((course) => (
                    <CourseCard
                        key={course.subjectCode + course.courseCode}
                        course={course}
                    />
                ))}
            </div>

            {filteredCourses.length >= maxNumCourses && (
                <div className="flex justify-center mt-4">
                    <Button onClick={handleShowMoreCourses} variant="outline">
                        Show More Courses
                        <ChevronDown className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
