"use client";

import { useEffect, useState } from "react";
import type { CourseListItem } from "@/lib/types";
import { useUniversity } from "@/components/university";

const requests = new Map<string, Promise<CourseListItem | null>>();

/** A course with its sections, fetched once per visit. */
export function fetchCourse(university: string, code: string): Promise<CourseListItem | null> {
    const key = `${university} ${code}`;
    let request = requests.get(key);
    if (!request) {
        request = fetch(`/api/course/${code}?${new URLSearchParams({ university })}`)
            .then((response) => (response.ok ? (response.json() as Promise<CourseListItem>) : null))
            .catch(() => null)
            .then((course) => {
                // Forget failures so a later visit can try again.
                if (!course) requests.delete(key);
                return course;
            });
        requests.set(key, request);
    }
    return request;
}

/** Full section data for a few courses (e.g. recently viewed), fetched once per course per visit. */
export function useCourseDetails(codes: string[]): Record<string, CourseListItem | null> {
    const { id: university } = useUniversity();
    const [details, setDetails] = useState<Record<string, CourseListItem | null>>({});
    const key = codes.join(",");

    useEffect(() => {
        let cancelled = false;
        const wanted = key ? key.split(",") : [];
        Promise.all(wanted.map(async (code) => [code, await fetchCourse(university, code)] as const)).then((entries) => {
            if (!cancelled) setDetails(Object.fromEntries(entries));
        });
        return () => {
            cancelled = true;
        };
    }, [key, university]);

    return details;
}
