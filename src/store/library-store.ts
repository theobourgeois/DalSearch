"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseAndSubjectCode } from "@/lib/types";
import { localStorageWithLegacy, readLegacy } from "./storage";

const MAX_RECENT_COURSES = 8;
const MAX_RECENT_QUERIES = 5;

type LibraryState = {
    saved: CourseAndSubjectCode[];
    recentCourses: CourseAndSubjectCode[];
    recentQueries: string[];
    toggleSaved: (course: CourseAndSubjectCode) => void;
    addRecentCourse: (course: CourseAndSubjectCode) => void;
    removeRecentCourse: (course: CourseAndSubjectCode) => void;
    addRecentQuery: (query: string) => void;
    clearRecent: () => void;
};

type PersistedLibrary = Pick<LibraryState, "saved" | "recentCourses" | "recentQueries">;

/** Versions before the redesign stored viewed courses as `{ subjectCode, courseCode }[]` under "recentSearches". */
function migrateRecentSearches(): PersistedLibrary | null {
    const legacy = readLegacy<unknown>("recentSearches");
    if (!Array.isArray(legacy)) return null;
    const recentCourses = legacy
        .filter((entry): entry is { subjectCode: string; courseCode: string } => typeof entry?.subjectCode === "string")
        .map(({ subjectCode, courseCode }) => `${subjectCode}${courseCode}` as CourseAndSubjectCode)
        .slice(0, MAX_RECENT_COURSES);
    return { saved: [], recentCourses, recentQueries: [] };
}

const pushUnique = <T>(list: T[], item: T, max: number) =>
    [item, ...list.filter((entry) => entry !== item)].slice(0, max);

/** Saved courses and recently viewed courses and searches. */
export const useLibraryStore = create<LibraryState>()(
    persist(
        (set) => ({
            saved: [],
            recentCourses: [],
            recentQueries: [],
            toggleSaved: (course) =>
                set((state) => ({
                    saved: state.saved.includes(course)
                        ? state.saved.filter((code) => code !== course)
                        : [...state.saved, course],
                })),
            addRecentCourse: (course) =>
                set((state) => ({ recentCourses: pushUnique(state.recentCourses, course, MAX_RECENT_COURSES) })),
            removeRecentCourse: (course) =>
                set((state) => ({ recentCourses: state.recentCourses.filter((code) => code !== course) })),
            addRecentQuery: (query) =>
                set((state) => ({ recentQueries: pushUnique(state.recentQueries, query.trim(), MAX_RECENT_QUERIES) })),
            clearRecent: () => set({ recentCourses: [], recentQueries: [] }),
        }),
        {
            name: "dalsearch:library",
            storage: localStorageWithLegacy(migrateRecentSearches),
            partialize: ({ saved, recentCourses, recentQueries }) => ({ saved, recentCourses, recentQueries }),
            skipHydration: true,
        },
    ),
);
