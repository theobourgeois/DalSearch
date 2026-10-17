"use client";

import { createContext, useContext, useMemo } from "react";
import type { Term } from "@/lib/constants";
import { listedCodes, termLabel, type TermInfo } from "@/lib/terms";
import { useScheduleStore } from "@/store/schedule-store";

type TermsValue = {
    /** Every known term, oldest first. */
    terms: TermInfo[];
    /** The terms on the timetable, oldest first. */
    listed: Term[];
    /** The term running today, decided once on the server so server and client render the same term. */
    current: Term;
    /** "Fall 2026" */
    label: (term: Term) => string;
    /** Options for term pickers; `isDisabled` greys out terms that don't apply. */
    options: (isDisabled?: (term: Term) => boolean) => { value: Term; label: string; disabled?: boolean }[];
};

const TermsContext = createContext<TermsValue | null>(null);

/** The university's terms from the database, shared with client components. */
export function TermsProvider({
    terms,
    current,
    children,
}: {
    terms: TermInfo[];
    current: Term;
    children: React.ReactNode;
}) {
    const value = useMemo(() => {
        const listed = listedCodes(terms);
        return {
            terms,
            listed,
            current,
            label: (term: Term) => termLabel(terms, term),
            options: (isDisabled?: (term: Term) => boolean) =>
                listed.map((term) => ({ value: term, label: termLabel(terms, term), disabled: isDisabled?.(term) })),
        };
    }, [terms, current]);
    return <TermsContext.Provider value={value}>{children}</TermsContext.Provider>;
}

export function useTerms(): TermsValue {
    const value = useContext(TermsContext);
    if (!value) throw new Error("useTerms must be used inside TermsProvider");
    return value;
}

export function useCurrentTerm(): Term {
    return useTerms().current;
}

/** The term the student is planning: the one they picked, or the current term once that term leaves the timetable. */
export function usePlannedTerm(): Term {
    const picked = useScheduleStore((state) => state.term);
    const { listed, current } = useTerms();
    return picked && listed.includes(picked) ? picked : current;
}
