"use client";

import { useMemo } from "react";
import { usePlannedTerm } from "@/components/current-term";
import { useCourseIndex } from "@/components/search/course-index";
import { courseColors } from "@/lib/colors";
import type { Term } from "@/lib/constants";
import { findConflicts, scheduledCourses, totalCredits } from "@/lib/schedule";
import { useHydrated } from "@/store/storage";
import { useScheduleStore, useTermSessions } from "@/store/schedule-store";

/**
 * Everything derived from the student's schedule for one term (defaults to the term being planned):
 * the sessions, course order and colours, clashes and credit total. Every page reads the schedule
 * through this hook so colours and conflict detection always agree.
 */
export function useTermSchedule(term?: Term) {
    const plannedTerm = usePlannedTerm();
    const activeTerm = term ?? plannedTerm;
    const sessions = useTermSessions(activeTerm);
    const ready = useHydrated(useScheduleStore);
    const { byCode } = useCourseIndex();

    return useMemo(() => {
        const codes = scheduledCourses(sessions);
        const conflicts = findConflicts(sessions);
        return {
            ready,
            term: activeTerm,
            sessions,
            codes,
            colors: courseColors(codes),
            conflicts,
            conflicted: new Set(conflicts.flatMap(({ first, second }) => [first.course, second.course])),
            credits: totalCredits(sessions, (code) => byCode.get(code)?.creditHours),
        };
    }, [ready, activeTerm, sessions, byCode]);
}

export type TermSchedule = ReturnType<typeof useTermSchedule>;
