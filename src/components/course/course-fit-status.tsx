import { useTerms } from "@/components/current-term";
import { Status, type StatusTone } from "@/components/ui/status";
import type { Term } from "@/lib/constants";
import { nextOfferedTerm } from "@/lib/course";
import { formatCourseCode, listSessions, sessionTypeLabel, type CourseFit } from "@/lib/schedule";
import { isTimed } from "@/lib/time";
import type { CourseListItem } from "@/lib/types";

type CourseFitStatusProps = {
    course: CourseListItem;
    fit: CourseFit;
    term: Term;
    /** The course's schedule colour, used when it's already scheduled. */
    color?: string;
    /** Hide the explanatory second line. */
    compact?: boolean;
    className?: string;
};

/** Explains in one line whether a course fits the student's schedule, and why not. */
export function CourseFitStatus({ course, fit, term, color, compact, className }: CourseFitStatusProps) {
    const terms = useTerms();
    const status = describeFit(course, fit, term, terms);
    return (
        <Status
            {...status}
            color={fit.status === "scheduled" ? color : undefined}
            detail={compact ? undefined : status.detail}
            className={className}
        />
    );
}

function describeFit(
    course: CourseListItem,
    fit: CourseFit,
    term: Term,
    terms: Pick<ReturnType<typeof useTerms>, "listed" | "label">,
): { tone?: StatusTone; label: string; detail?: string } {
    switch (fit.status) {
        case "scheduled":
            return { label: "In your schedule", detail: listSessions(fit.sessions) };
        case "fits": {
            const online = fit.picks.find((pick) => !isTimed(pick));
            const detail = online
                ? `With the online ${sessionTypeLabel(online.type).toLowerCase()}`
                : listSessions(fit.picks);
            return { tone: "success", label: "Fits", detail };
        }
        case "clash": {
            const type = sessionTypeLabel(fit.type).toLowerCase();
            return {
                tone: "danger",
                label: `Clashes with ${formatCourseCode(fit.clashesWith)}`,
                detail: fit.onlyOption ? `Its only ${type} overlaps` : `Every ${type} overlaps`,
            };
        }
        case "unavailable": {
            const next = nextOfferedTerm(course, term, terms.listed);
            return { label: next ? `Next offered ${terms.label(next)}` : `Not offered in ${terms.label(term)}` };
        }
    }
}
