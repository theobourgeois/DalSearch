"use client";

import { createContext, useCallback, useContext } from "react";
import { getUniversity, universityPath, type University } from "@/lib/university";

const UniversityContext = createContext<University | null>(null);

/** The university whose pages are showing, from the URL. */
export function UniversityProvider({ id, children }: { id: string; children: React.ReactNode }) {
    const university = getUniversity(id);
    if (!university) throw new Error(`Unknown university: ${id}`);
    return <UniversityContext.Provider value={university}>{children}</UniversityContext.Provider>;
}

export function useUniversity(): University {
    const university = useContext(UniversityContext);
    if (!university) throw new Error("useUniversity must be used inside UniversityProvider");
    return university;
}

/** Turns a page path into the current university's address for it: "/explore" -> "/msvu/explore". */
export function useHref(): (path: string) => string {
    const { id } = useUniversity();
    return useCallback((path: string) => universityPath(id, path), [id]);
}
