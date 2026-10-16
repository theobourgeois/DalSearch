"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CourseSearch } from "./course-search";

const SearchDialogContext = createContext<{ openSearch: () => void } | null>(null);

function isTyping(target: EventTarget | null) {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    );
}

/** Global course search, opened from the sidebar, with "/" or with Cmd/Ctrl+K. */
export function SearchDialogProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const openSearch = useCallback(() => setOpen(true), []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const commandK = event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
            if (commandK || (event.key === "/" && !isTyping(event.target))) {
                event.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const value = useMemo(() => ({ openSearch }), [openSearch]);

    return (
        <SearchDialogContext.Provider value={value}>
            {children}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    hideClose
                    aria-describedby={undefined}
                    className="top-[18vh] max-w-xl translate-y-0 gap-0 p-3"
                >
                    <DialogTitle className="sr-only">Search courses</DialogTitle>
                    <CourseSearch inline autoFocus size="lg" onSelect={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </SearchDialogContext.Provider>
    );
}

export function useSearchDialog() {
    const context = useContext(SearchDialogContext);
    if (!context) throw new Error("useSearchDialog must be used inside SearchDialogProvider");
    return context;
}
