"use client";

import { forwardRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import Fuse from "fuse.js";
import { Combobox } from "@/components/ui/combobox";
import { formatCourseCode } from "@/lib/schedule";
import type { CourseSummary } from "@/lib/types";
import { useLibraryStore } from "@/store/library-store";
import { useCourseIndex } from "./course-index";

const MAX_RESULTS = 8;
const MAX_RECENT_COURSES = 5;

type SearchItem = { kind: "course"; course: CourseSummary; group?: string } | { kind: "query"; query: string };

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

/** Recently viewed courses, then recent searches, for when nothing has been typed yet. */
function useRecentItems(): SearchItem[] {
    const { byCode } = useCourseIndex();
    const recentCourses = useLibraryStore((state) => state.recentCourses);
    const recentQueries = useLibraryStore((state) => state.recentQueries);

    return useMemo(
        () => [
            ...recentCourses
                .slice(0, MAX_RECENT_COURSES)
                .flatMap((code) => byCode.get(code) ?? [])
                .map((course): SearchItem => ({ kind: "course", course, group: "Recently viewed" })),
            ...recentQueries.map((query): SearchItem => ({ kind: "query", query })),
        ],
        [byCode, recentCourses, recentQueries],
    );
}

type CourseSearchProps = {
    query?: string;
    onQueryChange?: (query: string) => void;
    size?: "md" | "lg";
    placeholder?: string;
    autoFocus?: boolean;
    inline?: boolean;
    /** Show recently viewed courses and recent searches while the query is empty. */
    showRecent?: boolean;
    onSelect?: (course: CourseSummary) => void;
    className?: string;
};

/** Search over every course; choosing one opens its page and remembers the search. */
export const CourseSearch = forwardRef<HTMLInputElement, CourseSearchProps>(function CourseSearch(
    { query: controlledQuery, onQueryChange, placeholder = "Search by code or title", showRecent, onSelect, ...props },
    ref,
) {
    const router = useRouter();
    const addRecentQuery = useLibraryStore((state) => state.addRecentQuery);
    const [localQuery, setLocalQuery] = useState("");
    const query = controlledQuery ?? localQuery;
    const setQuery = onQueryChange ?? setLocalQuery;
    const matches = useCourseMatches(query);
    const recent = useRecentItems();

    const items: SearchItem[] =
        query.trim() || !showRecent ? matches.map((course) => ({ kind: "course", course })) : recent;

    const select = (item: SearchItem) => {
        if (item.kind === "query") {
            setQuery(item.query);
            return;
        }
        const trimmed = query.trim();
        if (trimmed && trimmed.replace(/\s+/g, "").toUpperCase() !== item.course.code) addRecentQuery(trimmed);
        setQuery("");
        onSelect?.(item.course);
        router.push(`/${item.course.code}`);
    };

    return (
        <Combobox
            {...props}
            ref={ref}
            query={query}
            onQueryChange={setQuery}
            items={items}
            getKey={(item) => (item.kind === "course" ? item.course.code : `query:${item.query}`)}
            getGroup={(item) => (item.kind === "course" ? item.group : "Recent searches")}
            onSelect={select}
            label="Search courses"
            placeholder={placeholder}
            renderItem={(item) =>
                item.kind === "course" ? (
                    <>
                        <span className="w-[5.5rem] shrink-0 font-bold">{formatCourseCode(item.course.code)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium text-fg-muted">{item.course.title}</span>
                        <span className="shrink-0 text-[13px] text-fg-subtle">{item.course.creditHours} cr</span>
                    </>
                ) : (
                    <>
                        <ClockCounterClockwiseIcon className="size-[18px] shrink-0 text-fg-subtle" />
                        <span className="min-w-0 flex-1 truncate font-medium">{item.query}</span>
                    </>
                )
            }
        />
    );
});
