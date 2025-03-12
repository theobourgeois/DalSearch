"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import { defaultFilter, getFilteredCourses } from "@/lib/course-utils";
import { CourseCard } from "./course-card";
import { CourseFilterPanel } from "./course-filter-panel";
import { useStoredState } from "@/hooks/use-stored-state";
import { OrderByCourses } from "./order-courses";
import type { Course, CourseFilter, CourseOrderBy } from "@/lib/types";

const MAX_NUM_COURSES = 10;

export function ExploreCourses({ courses }: { courses: Course[] }) {
    const [maxNumCourses, setMaxNumCourses] = useState(MAX_NUM_COURSES);

    const [filter, setFilter] = useStoredState<CourseFilter>(
        defaultFilter,
        "filter"
    );
    const [orderBy, setOrderBy] = useStoredState<CourseOrderBy>(
        {
            key: "title",
            direction: "asc",
        },
        "orderBy"
    );

    const debouncedFilter = useDebounce(filter, 300);

    const filteredCourses = useMemo(
        () =>
            getFilteredCourses(
                courses,
                debouncedFilter,
                orderBy,
                maxNumCourses
            ),
        [courses, debouncedFilter, maxNumCourses, orderBy]
    );

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
        <div className="flex flex-col md:flex-row h-full">
            {/* Filter Panel */}
            <CourseFilterPanel
                filter={filter}
                onFilterUpdate={handleFilterUpdate}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-2 sm:p-4 space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                className="pl-10 w-full rounded-full bg-white dark:bg-gray-800"
                                value={filter.searchTerm}
                                onChange={(e) =>
                                    handleSearchTermChange(e.target.value)
                                }
                                placeholder="Search for course name, code, or subject code"
                            />
                        </div>
                        <OrderByCourses
                            orderBy={orderBy}
                            onOrderByChange={handleChangeOrderBy}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="md:hidden rounded-full dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <Search className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Filter badges/indicators could go here */}

                    {filteredCourses.length === 0 && (
                        <div className="text-center text-gray-500">
                            No courses found
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {filteredCourses.map((course) => (
                            <CourseCard
                                showDescription={false}
                                keyword={filter.searchTerm}
                                key={course.subjectCode + course.courseCode}
                                course={course}
                                terms={filter.terms}
                            />
                        ))}
                    </div>

                    {filteredCourses.length >= maxNumCourses && (
                        <div className="flex justify-center mt-4">
                            <Button
                                onClick={handleShowMoreCourses}
                                variant="outline"
                            >
                                Show More Courses
                                <ChevronDown className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
