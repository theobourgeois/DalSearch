"use client";

import { useEffect, useState } from "react";
import type { CourseListItem } from "@/lib/types";

const requests = new Map<string, Promise<CourseListItem | null>>();

/** A course with its sections, fetched once per visit. */
export function fetchCourse(code: string): Promise<CourseListItem | null> {
    let request = requests.get(code);
    if (!request) {
        request = fetch(`/api/course/${code}`)
            .then((response) => (response.ok ? (response.json() as Promise<CourseListItem>) : null))
            .catch(() => null)
            .then((course) => {
                // Forget failures so a later visit can try again.
                if (!course) requests.delete(code);
                return course;
            });
        requests.set(code, request);
    }
    return request;
}

/** Full section data for a few courses (e.g. recently viewed), fetched once per course per visit. */
export function useCourseDetails(codes: string[]): Record<string, CourseListItem | null> {
    const [details, setDetails] = useState<Record<string, CourseListItem | null>>({});
    const key = codes.join(",");

    useEffect(() => {
        let cancelled = false;
        const wanted = key ? key.split(",") : [];
        Promise.all(wanted.map(async (code) => [code, await fetchCourse(code)] as const)).then((entries) => {
            if (!cancelled) setDetails(Object.fromEntries(entries));
        });
        return () => {
            cancelled = true;
        };
    }, [key]);

    return details;
}
