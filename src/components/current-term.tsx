"use client";

import { createContext, useContext } from "react";
import { termCodes, type Term } from "@/lib/constants";
import { useScheduleStore } from "@/store/schedule-store";

const CurrentTermContext = createContext<Term | null>(null);

/**
 * The term running today, decided once on the server and shared with client components so server and
 * client render the same term.
 */
export function CurrentTermProvider({ term, children }: { term: Term; children: React.ReactNode }) {
    return <CurrentTermContext.Provider value={term}>{children}</CurrentTermContext.Provider>;
}

export function useCurrentTerm(): Term {
    const term = useContext(CurrentTermContext);
    if (!term) throw new Error("useCurrentTerm must be used inside CurrentTermProvider");
    return term;
}

/** The term the student is planning: the one they picked, or the current term once that term leaves the timetable. */
export function usePlannedTerm(): Term {
    const picked = useScheduleStore((state) => state.term);
    const current = useCurrentTerm();
    return picked && termCodes.includes(picked) ? picked : current;
}
