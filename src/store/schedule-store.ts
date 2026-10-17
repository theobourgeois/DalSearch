"use client";

import { useMemo } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { useUniversity } from "@/components/university";
import { DEFAULT_UNIVERSITY } from "@/lib/university";
import type { Term } from "@/lib/constants";
import type { ClassSession, CourseAndSubjectCode } from "@/lib/types";
import { localStorageWithLegacy, readLegacy } from "./storage";

type ScheduleState = {
    sessions: ClassSession[];
    /** The term the student chose to plan, or null to follow the current term. */
    term: Term | null;
    setTerm: (term: Term) => void;
    /** Replaces every section of `course` in `term` with `sessions`. */
    setCourseSessions: (course: CourseAndSubjectCode, term: Term, sessions: ClassSession[]) => void;
    removeCourse: (course: CourseAndSubjectCode, term: Term) => void;
    clearTerm: (term: Term) => void;
    /** Swaps sessions saved before rooms were stored for `fresh` sessions of the same sections. */
    upgradeLegacySessions: (fresh: ClassSession[]) => void;
};

/** Sessions saved before rooms were stored have the timetable's raw location text and no campus. */
export const isLegacySession = (session: ClassSession) => !("campus" in session);

type PersistedSchedule = Pick<ScheduleState, "sessions" | "term">;

const isSession = (value: unknown): value is ClassSession =>
    typeof value === "object" && value !== null && typeof (value as ClassSession).crn === "string";

/** Versions before the redesign stored `{ class, color }[]` under "timeSlots". */
function migrateTimeSlots(): PersistedSchedule | null {
    const legacy = readLegacy<unknown>("timeSlots");
    if (!Array.isArray(legacy)) return null;
    const sessions = legacy.map((slot) => (slot as { class?: unknown } | null)?.class).filter(isSession);
    return { sessions, term: null };
}

const withoutCourse = (sessions: ClassSession[], course: CourseAndSubjectCode, term: Term) =>
    sessions.filter((session) => session.course !== course || session.term !== term);

function createScheduleStore(university: string) {
    return create<ScheduleState>()(
        persist(
            (set) => ({
                sessions: [],
                term: null,
                setTerm: (term) => set({ term }),
                setCourseSessions: (course, term, sessions) =>
                    set((state) => ({
                        sessions: [...withoutCourse(state.sessions, course, term), ...sessions],
                    })),
                removeCourse: (course, term) =>
                    set((state) => ({
                        sessions: withoutCourse(state.sessions, course, term),
                    })),
                clearTerm: (term) =>
                    set((state) => ({
                        sessions: state.sessions.filter((session) => session.term !== term),
                    })),
                upgradeLegacySessions: (fresh) =>
                    set((state) => {
                        const key = (session: ClassSession) => `${session.term} ${session.crn}`;
                        const freshByKey = new Map<string, ClassSession[]>();
                        fresh.forEach((session) =>
                            freshByKey.set(key(session), [...(freshByKey.get(key(session)) ?? []), session]),
                        );
                        const replaced = new Set<string>();
                        // A section that's gone from the timetable keeps its saved copy.
                        const sessions = state.sessions.flatMap((session) => {
                            const replacement = isLegacySession(session) ? freshByKey.get(key(session)) : undefined;
                            if (!replacement) return [session];
                            if (replaced.has(key(session))) return [];
                            replaced.add(key(session));
                            return replacement;
                        });
                        return { sessions };
                    }),
            }),
            {
                // Dal keeps the key it had before other universities, so saved schedules carry over.
                name: university === DEFAULT_UNIVERSITY ? "dalsearch:schedule" : `dalsearch:schedule:${university}`,
                storage: localStorageWithLegacy(university === DEFAULT_UNIVERSITY ? migrateTimeSlots : undefined),
                partialize: ({ sessions, term }) => ({ sessions, term }),
                skipHydration: true,
            },
        ),
    );
}

type ScheduleStore = UseBoundStore<StoreApi<ScheduleState>> & ReturnType<typeof createScheduleStore>;

const stores = new Map<string, ScheduleStore>();

/** Each university has its own schedule: course and term codes can repeat between universities. */
export function scheduleStoreFor(university: string): ScheduleStore {
    let store = stores.get(university);
    if (!store) {
        store = createScheduleStore(university);
        stores.set(university, store);
    }
    return store;
}

/** The current university's schedule store, for getState() and persistence. */
export function useScheduleStoreApi(): ScheduleStore {
    return scheduleStoreFor(useUniversity().id);
}

/** Reads the current university's schedule. */
export function useScheduleStore<T>(selector: (state: ScheduleState) => T): T {
    return useScheduleStoreApi()(selector);
}

/** Sessions scheduled in the given term. */
export function useTermSessions(term: Term): ClassSession[] {
    const sessions = useScheduleStore((state) => state.sessions);
    return useMemo(() => sessions.filter((session) => session.term === term), [sessions, term]);
}
