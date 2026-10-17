"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { useUniversity } from "@/components/university";
import { DEFAULT_UNIVERSITY, storageKey } from "@/lib/university";
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
function createLibraryStore(university: string) {
    return create<LibraryState>()(
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
                    set((state) => ({
                        recentCourses: pushUnique(state.recentCourses, course, MAX_RECENT_COURSES),
                    })),
                removeRecentCourse: (course) =>
                    set((state) => ({
                        recentCourses: state.recentCourses.filter((code) => code !== course),
                    })),
                addRecentQuery: (query) =>
                    set((state) => ({
                        recentQueries: pushUnique(state.recentQueries, query.trim(), MAX_RECENT_QUERIES),
                    })),
                clearRecent: () => set({ recentCourses: [], recentQueries: [] }),
            }),
            {
                // Dal keeps the key it had before other universities, so saved courses carry over.
                name: storageKey(university, "library"),
                storage: localStorageWithLegacy(university === DEFAULT_UNIVERSITY ? migrateRecentSearches : undefined),
                partialize: ({ saved, recentCourses, recentQueries }) => ({
                    saved,
                    recentCourses,
                    recentQueries,
                }),
                skipHydration: true,
            },
        ),
    );
}

type LibraryStore = UseBoundStore<StoreApi<LibraryState>> & ReturnType<typeof createLibraryStore>;

const stores = new Map<string, LibraryStore>();

/** Each university has its own saved and recent courses. */
export function libraryStoreFor(university: string): LibraryStore {
    let store = stores.get(university);
    if (!store) {
        store = createLibraryStore(university);
        stores.set(university, store);
    }
    return store;
}

/** The current university's library store, for getState() and persistence. */
export function useLibraryStoreApi(): LibraryStore {
    return libraryStoreFor(useUniversity().id);
}

/** Reads the current university's saved and recent courses. */
export function useLibraryStore<T>(selector: (state: LibraryState) => T): T {
    return useLibraryStoreApi()(selector);
}
