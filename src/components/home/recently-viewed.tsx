"use client";

import { useState } from "react";
import Link from "next/link";
import { XIcon } from "@phosphor-icons/react";
import { CourseFitStatus } from "@/components/course/course-fit-status";
import { SectionHeader } from "@/components/layout/page";
import { useCourseIndex } from "@/components/search/course-index";
import { Button } from "@/components/ui/button";
import { CellText } from "@/components/ui/data-list";
import { useCourseDetails } from "@/hooks/use-course-details";
import { useTermSchedule } from "@/hooks/use-term-schedule";
import { formatCourseCode, getCourseFit } from "@/lib/schedule";
import { useLibraryStore } from "@/store/library-store";
import { useHydrated } from "@/store/storage";

const COLLAPSED = 5;

/** The last courses opened, with whether each fits the schedule being planned. */
export function RecentlyViewed() {
    const recentCourses = useLibraryStore((state) => state.recentCourses);
    const removeRecentCourse = useLibraryStore((state) => state.removeRecentCourse);
    const clearRecent = useLibraryStore((state) => state.clearRecent);
    const ready = useHydrated(useLibraryStore);
    const [expanded, setExpanded] = useState(false);
    const { byCode } = useCourseIndex();
    const { term, sessions, colors } = useTermSchedule();
    const recent = expanded ? recentCourses : recentCourses.slice(0, COLLAPSED);
    const details = useCourseDetails(recent);

    if (!ready || recent.length === 0) return null;

    return (
        <section>
            <SectionHeader title="Recently viewed">
                <Button variant="link" onClick={clearRecent}>
                    Clear
                </Button>
            </SectionHeader>
            <ul className="mt-3.5 flex flex-col">
                {recent.map((code) => {
                    const course = details[code];
                    return (
                        <li
                            key={code}
                            className="group relative flex min-h-[3.75rem] items-center gap-4 border-b border-line py-2.5 pl-4 pr-2 last:border-b-0"
                        >
                            <CellText
                                className="flex-1"
                                primary={
                                    <Link href={`/${code}`} className="after:absolute after:inset-0">
                                        {formatCourseCode(code)}
                                    </Link>
                                }
                                secondary={byCode.get(code)?.title}
                            />
                            {course && (
                                <CourseFitStatus
                                    className="shrink-0"
                                    course={course}
                                    term={term}
                                    color={colors[code]}
                                    fit={getCourseFit(course, term, sessions)}
                                    compact
                                />
                            )}
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Remove ${formatCourseCode(code)} from recently viewed`}
                                className="relative z-10 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                                onClick={() => removeRecentCourse(code)}
                            >
                                <XIcon />
                            </Button>
                        </li>
                    );
                })}
            </ul>
            {recentCourses.length > COLLAPSED && (
                <Button variant="link" className="mt-3 px-4" onClick={() => setExpanded(!expanded)}>
                    {expanded ? "Show less" : `Show all ${recentCourses.length}`}
                </Button>
            )}
        </section>
    );
}
