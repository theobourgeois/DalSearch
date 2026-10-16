import { Notice } from "@/components/ui/notice";
import { dayNames } from "@/lib/constants";
import { formatCourseCode, type ScheduleConflict } from "@/lib/schedule";
import { formatMinutes } from "@/lib/time";

type ConflictNoticeProps = { conflicts: ScheduleConflict[]; action?: React.ReactNode; className?: string };

/** Describes the first clash in a schedule ("plus 2 more clashes" when there are others). */
export function ConflictNotice({ conflicts, action, className }: ConflictNoticeProps) {
    const [first] = conflicts;
    if (!first) return null;

    const days = first.days.map((day) => `${dayNames[day].long}s`).join(" and ");
    return (
        <Notice action={action} className={className}>
            <b>
                {formatCourseCode(first.first.course)} and {formatCourseCode(first.second.course)}
            </b>{" "}
            overlap on {days}, <span>{`${formatMinutes(first.start)}-${formatMinutes(first.end)}`}</span>
            {conflicts.length > 1 &&
                `, plus ${conflicts.length - 1} more ${conflicts.length === 2 ? "clash" : "clashes"}`}
            .
        </Notice>
    );
}
