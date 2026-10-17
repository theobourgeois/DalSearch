"use client";

import { useDeferredValue, useMemo } from "react";
import Link from "next/link";
import { useCurrentTerm, useTerms } from "@/components/current-term";
import { SingleSelectFilter } from "@/components/filters/filter-pill";
import { SortMenu, type SortState } from "@/components/filters/sort-menu";
import { SubjectFilter } from "@/components/filters/subject-filter";
import { SectionHeader } from "@/components/layout/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CellText, DataList, DataListHeader, DataListRow } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { ShowMore } from "@/components/ui/show-more";
import { Dot } from "@/components/ui/status";
import { Switch } from "@/components/ui/switch";
import { usePaged } from "@/hooks/use-paged";
import { useStoredState } from "@/hooks/use-stored-state";
import { useTermSchedule } from "@/hooks/use-term-schedule";
import { type Term } from "@/lib/constants";
import { describeRatingCount } from "@/lib/instructors";
import { formatCourseCode } from "@/lib/schedule";
import type { InstructorListItem, Subject } from "@/lib/types";
import { plural } from "@/lib/utils";

const PAGE_SIZE = 20;
const MAX_COURSES = 3;
const columns = "minmax(0,1.9fr) 6rem 7.5rem 5.5rem minmax(0,2.2fr)";

type SortKey = "rating" | "name" | "courses";
type InstructorFilter = {
    search: string;
    subjects: string[];
    minRating: number;
    teachingNow: boolean;
    sort: SortState<SortKey>;
};

const initialFilter: InstructorFilter = {
    search: "",
    subjects: [],
    minRating: 0,
    teachingNow: false,
    sort: { key: "rating", direction: "desc" },
};

const sortOptions: { value: SortKey; label: string }[] = [
    { value: "rating", label: "Rating" },
    { value: "name", label: "Name" },
    { value: "courses", label: "Number of courses" },
];

/** Ascending comparators; descending reverses them. */
const comparators: Record<SortKey, (a: InstructorListItem, b: InstructorListItem) => number> = {
    rating: (a, b) => (a.rating ?? 0) - (b.rating ?? 0) || a.ratingCount - b.ratingCount,
    name: (a, b) => a.displayName.localeCompare(b.displayName),
    courses: (a, b) => a.courseCount - b.courseCount,
};

function TeachingCell({
    instructor,
    currentTerm,
    onPanel,
}: {
    instructor: InstructorListItem;
    currentTerm: Term;
    onPanel: boolean;
}) {
    const { label: termLabel } = useTerms();
    const { teaching } = instructor;
    if (!teaching) return <span className="text-fg-subtle">Not teaching this year</span>;

    const extra = teaching.courses.length - MAX_COURSES;
    return (
        <>
            {teaching.term !== currentTerm && (
                <span className="mr-1 text-[13px] text-fg-subtle">{termLabel(teaching.term)}</span>
            )}
            {teaching.courses.slice(0, MAX_COURSES).map((code) => (
                <Link key={code} href={`/${code}`}>
                    <Badge className={onPanel ? "bg-panel" : "hover:bg-block"}>{formatCourseCode(code)}</Badge>
                </Link>
            ))}
            {extra > 0 && <span className="text-[13px] text-fg-subtle">+{extra}</span>}
        </>
    );
}

type InstructorRowProps = { instructor: InstructorListItem; currentTerm: Term; sharedCourse?: string; color?: string };

function InstructorRow({ instructor, currentTerm, sharedCourse, color }: InstructorRowProps) {
    const name = instructor.profileUrl ? (
        <a href={instructor.profileUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {instructor.displayName}
        </a>
    ) : (
        instructor.displayName
    );

    return (
        <DataListRow highlighted={!!sharedCourse}>
            <div className="flex min-w-0 items-center gap-3">
                <Avatar name={instructor.displayName} className={sharedCourse ? "bg-panel" : undefined} />
                <CellText
                    primary={name}
                    secondary={
                        sharedCourse ? (
                            <span className="flex items-center gap-1.5">
                                {color && <Dot color={color} />}
                                Teaches your {formatCourseCode(sharedCourse)}
                            </span>
                        ) : (
                            instructor.name
                        )
                    }
                />
            </div>
            <CellText
                primary={<span className="text-[17px] font-black">{instructor.rating?.toFixed(1) ?? "-"}</span>}
                secondary={describeRatingCount(instructor.ratingCount)}
            />
            <span className="hidden text-fg md:block">{instructor.takeAgain ?? "-"}</span>
            <span className="hidden text-fg md:block">{instructor.difficulty?.toFixed(1) ?? "-"}</span>
            <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex">
                <TeachingCell instructor={instructor} currentTerm={currentTerm} onPanel={!!sharedCourse} />
            </div>
        </DataListRow>
    );
}

/** Instructors with their RateMyProfessors scores, filterable by subject, rating and current teaching. */
export function InstructorsView({ instructors, subjects }: { instructors: InstructorListItem[]; subjects: Subject[] }) {
    const { label: termLabel } = useTerms();
    const currentTerm = useCurrentTerm();
    const [filter, setFilter] = useStoredState<InstructorFilter>(initialFilter, "dalsearch:instructors");
    const deferred = useDeferredValue(filter);
    const { codes, colors } = useTermSchedule(currentTerm);

    const results = useMemo(() => {
        const needle = deferred.search.trim().toLowerCase();
        const compare = comparators[deferred.sort.key];
        const direction = deferred.sort.direction === "asc" ? 1 : -1;
        return instructors
            .filter(
                (instructor) =>
                    (!needle || `${instructor.displayName} ${instructor.name}`.toLowerCase().includes(needle)) &&
                    (deferred.subjects.length === 0 ||
                        instructor.subjects.some((code) => deferred.subjects.includes(code))) &&
                    (instructor.rating ?? 0) >= deferred.minRating &&
                    (!deferred.teachingNow || instructor.teaching?.term === currentTerm),
            )
            .sort((a, b) => compare(a, b) * direction);
    }, [instructors, deferred, currentTerm]);
    const page = usePaged(results, PAGE_SIZE);

    const update = (patch: Partial<InstructorFilter>) => {
        setFilter((current) => ({ ...current, ...patch }));
        page.reset();
    };

    return (
        <>
            <SearchField
                size="lg"
                className="mt-7"
                value={filter.search}
                onValueChange={(search) => update({ search })}
                placeholder="Search by name"
                aria-label="Search instructors"
            />

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <SubjectFilter
                    subjects={subjects}
                    selected={filter.subjects}
                    onChange={(selected) => update({ subjects: selected })}
                />
                <SingleSelectFilter
                    label="Rating"
                    value={filter.minRating}
                    emptyValue={0}
                    onChange={(minRating) => update({ minRating })}
                    options={[0, 4, 3, 2].map((rating) => ({
                        value: rating,
                        label: rating === 0 ? "Any rating" : `${rating} or higher`,
                    }))}
                    summary={(option) => `${option.value}+`}
                />
                <Switch
                    className="sm:ml-auto"
                    checked={filter.teachingNow}
                    onCheckedChange={(teachingNow) => update({ teachingNow })}
                    label={`Only instructors teaching in ${termLabel(currentTerm)}`}
                />
            </div>

            <SectionHeader className="mt-10" title={plural(results.length, "instructor")}>
                <SortMenu value={filter.sort} options={sortOptions} onChange={(sort) => update({ sort })} />
            </SectionHeader>

            {results.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    title="No instructors match"
                    action={
                        <Button variant="outline" onClick={() => setFilter(initialFilter)}>
                            Reset filters
                        </Button>
                    }
                />
            ) : (
                <DataList columns={columns} className="mt-3">
                    <DataListHeader>
                        <span>Instructor</span>
                        <span>Rating</span>
                        <span>Would take again</span>
                        <span>Difficulty</span>
                        <span>Teaching</span>
                    </DataListHeader>
                    {page.visible.map((instructor) => {
                        const teachingNow =
                            instructor.teaching?.term === currentTerm ? instructor.teaching.courses : [];
                        const sharedCourse = teachingNow.find((code) => codes.includes(code));
                        return (
                            <InstructorRow
                                key={instructor.name}
                                instructor={instructor}
                                currentTerm={currentTerm}
                                sharedCourse={sharedCourse}
                                color={sharedCourse ? colors[sharedCourse] : undefined}
                            />
                        );
                    })}
                </DataList>
            )}

            <ShowMore count={page.nextPageSize} onClick={page.showMore} />
        </>
    );
}
