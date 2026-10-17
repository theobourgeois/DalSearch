import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** The mark's outline: a rounded square with one block taken out, the slot in your week a course fits. */
export const TERMLY_MARK_PATH =
    "M9 3h14a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6V9a6 6 0 0 1 6-6zm7.5 11a2.5 2.5 0 0 0-2.5 2.5v6a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5v-6a2.5 2.5 0 0 0-2.5-2.5z";

/** Termly's mark, in the current text colour (or a school's accent with `text-accent`). */
export function TermlyMark({ className }: { className?: string }) {
    return (
        <svg viewBox="3 3 26 26" fill="currentColor" className={cn("size-6 shrink-0", className)} aria-hidden>
            <path fillRule="evenodd" d={TERMLY_MARK_PATH} />
        </svg>
    );
}

/** The mark beside the wordmark. */
export function TermlyLogo({ className }: { className?: string }) {
    return (
        <span className={cn("flex items-center gap-2 text-[20px] font-black tracking-[-0.04em]", className)}>
            <TermlyMark className="size-[0.95em]" />
            {SITE_NAME}
        </span>
    );
}
