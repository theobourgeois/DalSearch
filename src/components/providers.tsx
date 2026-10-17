"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { TermsProvider, useTerms } from "@/components/current-term";
import { CourseIndexProvider } from "@/components/search/course-index";
import { SearchDialogProvider } from "@/components/search/search-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Term } from "@/lib/constants";
import type { TermInfo } from "@/lib/terms";
import type { CourseSummary } from "@/lib/types";
import { fetchCourse } from "@/hooks/use-course-details";
import { useLibraryStore } from "@/store/library-store";
import { isLegacySession, useScheduleStore } from "@/store/schedule-store";
import { useHydrated } from "@/store/storage";

/** Loads persisted stores after the first render so server and client markup match. */
function StoreHydration() {
    useEffect(() => {
        void useScheduleStore.persist.rehydrate();
        void useLibraryStore.persist.rehydrate();
    }, []);
    return null;
}

/** Brings schedules saved before rooms were stored up to date, so they show readable rooms. */
function UpgradeSavedSchedule() {
    const { listed } = useTerms();
    const ready = useHydrated(useScheduleStore);
    useEffect(() => {
        if (!ready) return;
        const legacy = useScheduleStore
            .getState()
            .sessions.filter((session) => isLegacySession(session) && listed.includes(session.term));
        const codes = [...new Set(legacy.map((session) => session.course))];
        if (codes.length === 0) return;
        void Promise.all(codes.map(fetchCourse)).then((courses) =>
            useScheduleStore.getState().upgradeLegacySessions(courses.flatMap((course) => course?.termClasses ?? [])),
        );
    }, [ready, listed]);
    return null;
}

type ProvidersProps = { courseIndex: CourseSummary[]; terms: TermInfo[]; currentTerm: Term; children: React.ReactNode };

export function Providers({ courseIndex, terms, currentTerm, children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TermsProvider terms={terms} current={currentTerm}>
                <CourseIndexProvider courses={courseIndex}>
                    <TooltipProvider delayDuration={200}>
                        <SearchDialogProvider>
                            <StoreHydration />
                            <UpgradeSavedSchedule />
                            {children}
                            <Toaster />
                        </SearchDialogProvider>
                    </TooltipProvider>
                </CourseIndexProvider>
            </TermsProvider>
        </ThemeProvider>
    );
}
