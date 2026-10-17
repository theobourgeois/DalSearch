"use client";

import { useEffect } from "react";
import type { CourseAndSubjectCode } from "@/lib/types";
import { useLibraryStore, useLibraryStoreApi } from "@/store/library-store";
import { useHydrated } from "@/store/storage";

/** Adds the course to "Recently viewed" once saved history has loaded. */
export function RecordRecentCourse({ code }: { code: CourseAndSubjectCode }) {
    const ready = useHydrated(useLibraryStoreApi());
    const addRecentCourse = useLibraryStore((state) => state.addRecentCourse);

    useEffect(() => {
        if (ready) addRecentCourse(code);
    }, [ready, addRecentCourse, code]);

    return null;
}
