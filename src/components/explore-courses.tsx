"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useDebounce } from "@uidotdev/usehooks";
import {
    Course,
    CourseFilter,
    CourseOrderBy,
    defaultFilter,
    getFilteredCourses,
} from "@/utils/course";
import { CourseCard } from "./course-card";
import { CourseFilterDrawer } from "./course-filter-drawer";
import { useStoredState } from "@/hooks/use-stored-state";
import { OrderByCourses } from "./order-courses";

const MAX_NUM_COURSES = 10;

export function ExploreCourses({ courses }: { courses: Course[] }) {
    const [maxNumCourses, setMaxNumCourses] = useState(MAX_NUM_COURSES);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        className="pl-10 w-full rounded-full bg-white"
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
            {filteredCourses.length === 0 && (
                <div className="text-center text-gray-500">
                    No courses found
                </div>
            )}

            <div className="flex flex-col gap-4">
                {filteredCourses.map((course) => (
                    <CourseCard
                        keyword={filter.searchTerm}
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
