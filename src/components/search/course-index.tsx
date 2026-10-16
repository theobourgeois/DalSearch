"use client";

import { createContext, useContext, useMemo } from "react";
import type { CourseSummary } from "@/lib/types";

type CourseIndex = {
    courses: CourseSummary[];
    byCode: Map<string, CourseSummary>;
};

const CourseIndexContext = createContext<CourseIndex | null>(null);

/** Makes the lightweight course index (code, title, credits) available to client components. */
export function CourseIndexProvider({ courses, children }: { courses: CourseSummary[]; children: React.ReactNode }) {
    const value = useMemo(
        () => ({ courses, byCode: new Map(courses.map((course) => [course.code, course])) }),
        [courses],
    );
    return <CourseIndexContext.Provider value={value}>{children}</CourseIndexContext.Provider>;
}

export function useCourseIndex(): CourseIndex {
    const index = useContext(CourseIndexContext);
    if (!index) throw new Error("useCourseIndex must be used inside CourseIndexProvider");
    return index;
}
