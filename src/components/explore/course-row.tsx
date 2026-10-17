import Link from "next/link";
import { CourseFitStatus } from "@/components/course/course-fit-status";
import { SaveButton } from "@/components/course/save-button";
import { CellText, DataListRow } from "@/components/ui/data-list";
import type { Term } from "@/lib/constants";
import { courseKey, formatCourseCode, type CourseFit } from "@/lib/schedule";
import { formatDays, formatTimeRange, isTimed } from "@/lib/time";
import type { CourseListItem } from "@/lib/types";

export const courseRowColumns = "minmax(0,1.8fr) minmax(0,1.2fr) minmax(0,1.3fr) 4.5rem minmax(0,2fr) 2rem";

type CourseRowProps = {
    course: CourseListItem;
    fit: CourseFit;
    term: Term;
    color?: string;
    ratings: Record<string, number>;
};

function seats(course: CourseListItem, term: Term) {
    const { enrolled, capacity } = course.enrollmentByTerm[term] ?? {};
    if (!capacity) return <span className="text-fg-subtle">-</span>;
    if (enrolled >= capacity) return <span className="font-bold text-danger">Full</span>;
    return <span className="text-fg">{`${enrolled}/${capacity}`}</span>;
}

/** One course in the Explore list: who teaches it, when the lecture is, seats, and whether it fits. */
export function CourseRow({ course, fit, term, color, ratings }: CourseRowProps) {
    const code = courseKey(course);
    const [instructor] = course.instructorsByTerm[term] ?? [];
    const rating = instructor ? ratings[instructor] : undefined;
    const lecture = course.termClasses.find(
        (session) => session.term === term && session.type === "Lec" && isTimed(session),
    );

    return (
        <DataListRow className="relative">
            <CellText
                primary={
                    <Link href={`/${code}`} className="after:absolute after:inset-0 after:rounded-row">
                        {formatCourseCode(code)}
                    </Link>
                }
                secondary={course.title}
            />
            <CellText
                className="hidden md:block"
                primary={<span className="font-medium">{instructor ?? "Staff"}</span>}
                secondary={rating ? `${rating.toFixed(1)} / 5` : "No ratings yet"}
            />
            <CellText
                className="hidden md:block"
                primary={
                    <span className="font-medium">
                        {lecture && isTimed(lecture) ? formatDays(lecture.days) : "Online"}
                    </span>
                }
                secondary={lecture && isTimed(lecture) ? formatTimeRange(lecture) : undefined}
            />
            <span className="hidden md:block">{seats(course, term)}</span>
            <CourseFitStatus course={course} fit={fit} term={term} color={color} />
            <SaveButton
                code={code}
                size="icon-sm"
                className="relative z-10 hidden md:inline-flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:aria-pressed:opacity-100"
            />
        </DataListRow>
    );
}
