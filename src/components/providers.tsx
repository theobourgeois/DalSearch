"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { CurrentTermProvider } from "@/components/current-term";
import { CourseIndexProvider } from "@/components/search/course-index";
import { SearchDialogProvider } from "@/components/search/search-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Term } from "@/lib/constants";
import type { CourseSummary } from "@/lib/types";
import { useLibraryStore } from "@/store/library-store";
import { useScheduleStore } from "@/store/schedule-store";

/** Loads persisted stores after the first render so server and client markup match. */
function StoreHydration() {
    useEffect(() => {
        void useScheduleStore.persist.rehydrate();
        void useLibraryStore.persist.rehydrate();
    }, []);
    return null;
}

type ProvidersProps = { courseIndex: CourseSummary[]; currentTerm: Term; children: React.ReactNode };

export function Providers({ courseIndex, currentTerm, children }: ProvidersProps) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <CurrentTermProvider term={currentTerm}>
                <CourseIndexProvider courses={courseIndex}>
                    <TooltipProvider delayDuration={200}>
                        <SearchDialogProvider>
                            <StoreHydration />
                            {children}
                            <Toaster />
                        </SearchDialogProvider>
                    </TooltipProvider>
                </CourseIndexProvider>
            </CurrentTermProvider>
        </ThemeProvider>
    );
}
