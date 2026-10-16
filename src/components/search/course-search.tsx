"use client";

import { forwardRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Combobox } from "@/components/ui/combobox";
import { formatCourseCode } from "@/lib/schedule";
import type { CourseSummary } from "@/lib/types";
import { useLibraryStore } from "@/store/library-store";
import { useCourseIndex } from "./course-index";

const MAX_RESULTS = 8;

/** Exact code prefixes first ("CSCI 21"), then fuzzy matches on code and title. */
function useCourseMatches(query: string): CourseSummary[] {
    const { courses } = useCourseIndex();
    const fuse = useMemo(
        () =>
            new Fuse(
                courses.map((course) => ({
                    course,
                    text: `${course.code} ${formatCourseCode(course.code)} ${course.title}`,
                })),
                { keys: ["text"], threshold: 0.3, ignoreLocation: true },
            ),
        [courses],
    );

    return useMemo(() => {
        const needle = query.trim();
        if (!needle) return [];
        const compact = needle.replace(/\s+/g, "").toUpperCase();
        const byCode = courses.filter((course) => course.code.startsWith(compact));
        const fuzzy = fuse.search(needle, { limit: MAX_RESULTS * 2 }).map((result) => result.item.course);
        return [...new Set([...byCode, ...fuzzy])].slice(0, MAX_RESULTS);
    }, [courses, fuse, query]);
}

type CourseSearchProps = {
    query?: string;
    onQueryChange?: (query: string) => void;
    size?: "md" | "lg";
    placeholder?: string;
    autoFocus?: boolean;
    inline?: boolean;
    onSelect?: (course: CourseSummary) => void;
    className?: string;
};

/** Search over every course; choosing one opens its page and remembers the search. */
export const CourseSearch = forwardRef<HTMLInputElement, CourseSearchProps>(function CourseSearch(
    { query: controlledQuery, onQueryChange, placeholder = "Search by code or title", onSelect, ...props },
    ref,
) {
    const router = useRouter();
    const addRecentQuery = useLibraryStore((state) => state.addRecentQuery);
    const [localQuery, setLocalQuery] = useState("");
    const query = controlledQuery ?? localQuery;
    const setQuery = onQueryChange ?? setLocalQuery;
    const matches = useCourseMatches(query);

    const select = (course: CourseSummary) => {
        const trimmed = query.trim();
        if (trimmed && trimmed.replace(/\s+/g, "").toUpperCase() !== course.code) addRecentQuery(trimmed);
        setQuery("");
        onSelect?.(course);
        router.push(`/${course.code}`);
    };

    return (
        <Combobox
            {...props}
            ref={ref}
            query={query}
            onQueryChange={setQuery}
            items={matches}
            getKey={(course) => course.code}
            onSelect={select}
            label="Search courses"
            placeholder={placeholder}
            renderItem={(course) => (
                <>
                    <span className="w-[5.5rem] shrink-0 font-bold">{formatCourseCode(course.code)}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-fg-muted">{course.title}</span>
                    <span className="shrink-0 text-[13px] text-fg-subtle">{course.creditHours} cr</span>
                </>
            )}
        />
    );
});
