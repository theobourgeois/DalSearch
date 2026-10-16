"use client";

import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { AsideDivider, AsideHeading } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Property, PropertyList } from "@/components/ui/property-list";
import { links, termLabel } from "@/lib/constants";
import { describeFormat, primaryCampus, termSessions } from "@/lib/course";
import type { RatingSummary } from "@/lib/instructors";
import { formatCourseCode } from "@/lib/schedule";
import type { CourseAndSubjectCode } from "@/lib/types";
import { useCourse } from "./course-context";

const MAX_UNLOCKS = 4;

function CourseLinks({ codes }: { codes: string[] }) {
    return (
        <span className="flex flex-col">
            {codes.map((code) => (
                <Link
                    key={code}
                    href={`/${code}`}
                    className="w-fit underline decoration-fg-subtle underline-offset-[3px] hover:decoration-fg"
                >
                    {formatCourseCode(code)}
                </Link>
            ))}
        </span>
    );
}

function InstructorLine({ summary }: { summary: RatingSummary }) {
    const name = summary.profileUrl ? (
        <a href={summary.profileUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {summary.displayName}
        </a>
    ) : (
        summary.displayName
    );
    return (
        <div className="flex gap-3">
            <Avatar name={summary.displayName} />
            <div className="min-w-0 text-[13px] text-fg-muted">
                <span className="block truncate text-[14.5px] font-bold text-fg">{name}</span>
                {summary.rating ? (
                    <>
                        <span className="block">
                            <b className="font-bold text-fg">{summary.rating.toFixed(1)}</b> on RateMyProfessors
                        </span>
                        {summary.takeAgain && <span className="block">{summary.takeAgain} would take again</span>}
                    </>
                ) : (
                    <span className="block">No ratings yet</span>
                )}
            </div>
        </div>
    );
}

type CourseDetailsProps = {
    prerequisites: CourseAndSubjectCode[];
    unlocks: CourseAndSubjectCode[];
    /** RateMyProfessors summaries for everyone who teaches the course. */
    ratings: Record<string, RatingSummary>;
};

/** The details column on the course page; term-specific facts follow the term picked on the page. */
export function CourseDetails({ prerequisites, unlocks, ratings }: CourseDetailsProps) {
    const { course, term, offered } = useCourse();
    const sessions = termSessions(course, term);
    const campus = primaryCampus(sessions);
    const instructors = course.instructorsByTerm[term] ?? [];
    const { enrolled, capacity } = course.enrollement ?? {};
    const extraUnlocks = unlocks.length - MAX_UNLOCKS;

    return (
        <>
            <PropertyList>
                <Property label="Credit hours">{course.creditHours}</Property>
                <Property label="Level">{course.courseCode[0]}000</Property>
                {sessions.length > 0 && <Property label="Format">{describeFormat(sessions)}</Property>}
                {campus && <Property label="Campus">{campus}</Property>}
                {capacity > 0 && (
                    <Property label="Enrollment">
                        {`${enrolled}/${capacity}`}{" "}
                        <span className="text-fg-subtle">({Math.max(capacity - enrolled, 0)} left)</span>
                    </Property>
                )}
                {prerequisites.length > 0 && (
                    <Property label="Prerequisites">
                        <CourseLinks codes={prerequisites} />
                    </Property>
                )}
                {unlocks.length > 0 && (
                    <Property label="Leads to">
                        <CourseLinks codes={unlocks.slice(0, MAX_UNLOCKS)} />
                        {extraUnlocks > 0 && <span className="text-fg-subtle">and {extraUnlocks} more</span>}
                    </Property>
                )}
                <Property label="Offered">
                    {offered.length > 0 ? (
                        <span className="flex flex-col">
                            {offered.map((code) => (
                                <span key={code}>{termLabel(code)}</span>
                            ))}
                        </span>
                    ) : (
                        <span className="text-fg-subtle">Not this year</span>
                    )}
                </Property>
            </PropertyList>

            {instructors.length > 0 && (
                <>
                    <AsideDivider />
                    <AsideHeading>Instructors in {termLabel(term)}</AsideHeading>
                    <div className="flex flex-col gap-4">
                        {instructors.map((name) => (
                            <InstructorLine key={name} summary={ratings[name]} />
                        ))}
                    </div>
                </>
            )}

            <AsideDivider />
            <a
                href={links.timetable}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-bold text-fg-muted hover:text-fg"
            >
                Open in Dal timetable
                <ArrowUpRightIcon className="size-4" />
            </a>
        </>
    );
}
