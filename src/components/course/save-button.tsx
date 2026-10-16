"use client";

import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { CourseAndSubjectCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/store/library-store";

/** Toggles a course in the student's saved list. */
export function SaveButton({
    code,
    size = "icon",
    className,
}: {
    code: CourseAndSubjectCode;
    size?: "icon" | "icon-sm";
    className?: string;
}) {
    const saved = useLibraryStore((state) => state.saved.includes(code));
    const toggleSaved = useLibraryStore((state) => state.toggleSaved);
    const label = saved ? "Remove from saved" : "Save for later";

    return (
        <SimpleTooltip label={label}>
            <Button
                variant="ghost"
                size={size}
                onClick={() => toggleSaved(code)}
                aria-label={label}
                aria-pressed={saved}
                className={cn(saved && "text-fg", className)}
            >
                <BookmarkSimpleIcon weight={saved ? "fill" : "regular"} />
            </Button>
        </SimpleTooltip>
    );
}
