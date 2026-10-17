"use client";

import { useMemo, useRef, useState } from "react";
import { useCourseIndex } from "@/components/search/course-index";
import { CourseSearch } from "@/components/search/course-search";
import { formatCourseCode } from "@/lib/schedule";
import type { CourseSummary } from "@/lib/types";
import { useLibraryStore, useLibraryStoreApi } from "@/store/library-store";
import { useHydrated } from "@/store/storage";

/**
 * A real course to suggest searching for: an intro course with a short title, so the hint works at
 * every university ("Try "MATH 1000" or "Differential Calculus"").
 */
function exampleCourse(courses: CourseSummary[]): CourseSummary | undefined {
    const intro = courses.filter(
        (course) => /^[A-Z]+1\d{2,3}$/.test(course.code) && course.title.split(" ").length <= 3,
    );
    return intro[Math.floor(intro.length / 3)] ?? courses[0];
}

/** The big search on the home page, with the student's recent searches underneath. */
export function HomeSearch() {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const recentQueries = useLibraryStore((state) => state.recentQueries);
    const ready = useHydrated(useLibraryStoreApi());
    const { courses } = useCourseIndex();
    const example = useMemo(() => exampleCourse(courses), [courses]);

    return (
        <div className="mt-7">
            <CourseSearch
                ref={inputRef}
                size="lg"
                query={query}
                onQueryChange={setQuery}
                placeholder={
                    example
                        ? `Try "${formatCourseCode(example.code)}" or "${example.title}"`
                        : "Search by code, title or subject"
                }
            />
            {ready && recentQueries.length > 0 && (
                <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-1">
                    <span className="mr-1 text-[13.5px] font-medium text-fg-subtle">Recent</span>
                    {recentQueries.map((recent) => (
                        <button
                            key={recent}
                            type="button"
                            onClick={() => {
                                setQuery(recent);
                                inputRef.current?.focus();
                            }}
                            className="h-8 rounded-full bg-raised px-3.5 text-[13.5px] font-bold transition-colors hover:bg-block"
                        >
                            {recent}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
