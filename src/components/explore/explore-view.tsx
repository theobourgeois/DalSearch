"use client";

import { useDeferredValue, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentTerm, usePlannedTerm } from "@/components/current-term";
import { MultiSelectFilter, SingleSelectFilter } from "@/components/filters/filter-pill";
import { SortMenu, type SortState } from "@/components/filters/sort-menu";
import { SubjectFilter } from "@/components/filters/subject-filter";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { DataList, DataListHeader } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { ShowMore } from "@/components/ui/show-more";
import { Switch } from "@/components/ui/switch";
import { usePaged } from "@/hooks/use-paged";
import { useStoredState } from "@/hooks/use-stored-state";
import { useTermSchedule } from "@/hooks/use-term-schedule";
import { courseLevels, scheduleBufferOptions, termLabel, termOptions, type Term } from "@/lib/constants";
import { defaultFilter, filterCourses, sortCourses } from "@/lib/filter";
import { courseKey, getCourseFit } from "@/lib/schedule";
import type { CourseFilter, CourseListItem, CourseOrderByKey, ScheduleBufferMinutes, Subject } from "@/lib/types";
import { formatNumber, plural } from "@/lib/utils";
import { useScheduleStore } from "@/store/schedule-store";
import { CourseRow, courseRowColumns } from "./course-row";

const PAGE_SIZE = 20;

const sortOptions: { value: CourseOrderByKey; label: string }[] = [
    { value: "courseCode", label: "Course code" },
    { value: "title", label: "Title" },
    { value: "creditHours", label: "Credit hours" },
    { value: "numClasses", label: "Number of sections" },
];

type ExploreState = { filter: CourseFilter; sort: SortState<CourseOrderByKey> };

const initialState = (term: Term): ExploreState => ({
    filter: { ...defaultFilter, terms: [term] },
    sort: { key: "courseCode", direction: "asc" },
});

type ExploreViewProps = {
    courses: CourseListItem[];
    subjects: Subject[];
    creditHours: number[];
    ratings: Record<string, number>;
};

export function ExploreView({ courses, subjects, creditHours, ratings }: ExploreViewProps) {
    const currentTerm = useCurrentTerm();
    const initial = initialState(currentTerm);
    const [{ filter, sort }, setState] = useStoredState<ExploreState>(initial, "dalsearch:explore", (stored) => ({
        filter: { ...initial.filter, ...stored.filter },
        sort: { ...initial.sort, ...stored.sort },
    }));
    const subjectParam = useSearchParams().get("subject");
    const deferredFilter = useDeferredValue(filter);
    const sessions = useScheduleStore((state) => state.sessions);
    const plannedTerm = usePlannedTerm();
    const statusTerm = filter.terms.length === 1 ? filter.terms[0] : plannedTerm;
    const { colors } = useTermSchedule(statusTerm);

    useEffect(() => {
        if (subjectParam)
            setState((state) => ({
                ...state,
                filter: { ...state.filter, subjectCodes: [subjectParam], searchTerm: "" },
            }));
        // Only react to the URL changing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjectParam]);

    // Status and the "fits" filter come from the same calculation, so they always agree.
    const results = useMemo(() => {
        const matching = filterCourses(courses, { ...deferredFilter, scheduleFitOnly: false });
        const buffer = deferredFilter.scheduleFitOnly ? deferredFilter.scheduleBufferMinutes : 0;
        const withFit = sortCourses(matching, sort).map((course) => ({
            course,
            fit: getCourseFit(course, statusTerm, sessions, buffer),
        }));
        return deferredFilter.scheduleFitOnly
            ? withFit.filter(({ fit }) => fit.status === "fits" || fit.status === "scheduled")
            : withFit;
    }, [courses, deferredFilter, sessions, sort, statusTerm]);
    const fitCount = results.filter(({ fit }) => fit.status === "fits").length;
    const page = usePaged(results, PAGE_SIZE);

    const update = (patch: Partial<CourseFilter>) => {
        setState((state) => ({ ...state, filter: { ...state.filter, ...patch } }));
        page.reset();
    };

    return (
        <>
            <SearchField
                size="lg"
                className="mt-7"
                value={filter.searchTerm}
                onValueChange={(searchTerm) => update({ searchTerm })}
                placeholder="Search by code or title"
                aria-label="Search courses"
            />

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <MultiSelectFilter
                    label="Term"
                    options={termOptions()}
                    selected={filter.terms}
                    onChange={(terms) => update({ terms })}
                    summary={(chosen) => (chosen.length === 1 ? chosen[0].label : `${chosen.length} terms`)}
                />
                <SubjectFilter
                    subjects={subjects}
                    selected={filter.subjectCodes}
                    onChange={(subjectCodes) => update({ subjectCodes })}
                />
                <MultiSelectFilter
                    label="Level"
                    options={courseLevels.map((level) => ({ value: level, label: level }))}
                    selected={filter.courseLevels}
                    onChange={(selected) => update({ courseLevels: selected })}
                    summary={(chosen) => chosen.map((option) => option.label).join(", ")}
                />
                <MultiSelectFilter
                    label="Credit hours"
                    options={creditHours.map((hours) => ({ value: hours, label: String(hours) }))}
                    selected={filter.creditHours}
                    onChange={(selected) => update({ creditHours: selected })}
                    summary={(chosen) => chosen.map((option) => option.label).join(", ")}
                />

                <div className="flex items-center gap-2 sm:ml-auto">
                    <Switch
                        checked={filter.scheduleFitOnly}
                        onCheckedChange={(scheduleFitOnly) => update({ scheduleFitOnly })}
                        label="Only courses that fit my schedule"
                    />
                    {filter.scheduleFitOnly && (
                        <SingleSelectFilter<ScheduleBufferMinutes>
                            label="Buffer"
                            value={filter.scheduleBufferMinutes}
                            onChange={(scheduleBufferMinutes) => update({ scheduleBufferMinutes })}
                            options={scheduleBufferOptions.map((minutes) => ({
                                value: minutes,
                                label: minutes === 0 ? "No buffer" : `${minutes} minutes between classes`,
                            }))}
                            summary={(option) => `${option.value} min`}
                        />
                    )}
                </div>
            </div>

            <SectionHeader
                className="mt-10"
                title={
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>{plural(results.length, "course")}</span>
                        <span className="flex items-center gap-2 text-sm font-medium text-fg-muted">
                            <span className="size-2 rounded-full bg-success" />
                            {`${formatNumber(fitCount)} fit your ${termLabel(statusTerm)} schedule`}
                        </span>
                    </span>
                }
            >
                <SortMenu
                    value={sort}
                    options={sortOptions}
                    onChange={(next) => setState((state) => ({ ...state, sort: next }))}
                />
            </SectionHeader>

            {results.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    title="No courses match these filters"
                    action={
                        <Button variant="outline" onClick={() => setState(initial)}>
                            Reset filters
                        </Button>
                    }
                />
            ) : (
                <DataList columns={courseRowColumns} className="mt-3">
                    <DataListHeader>
                        <span>Course</span>
                        <span>Instructor</span>
                        <span>Lecture</span>
                        <span>Seats</span>
                        <span>Your schedule</span>
                        <span />
                    </DataListHeader>
                    {page.visible.map(({ course, fit }) => (
                        <CourseRow
                            key={courseKey(course)}
                            course={course}
                            fit={fit}
                            term={statusTerm}
                            color={colors[courseKey(course)]}
                            ratings={ratings}
                        />
                    ))}
                </DataList>
            )}

            <ShowMore count={page.nextPageSize} onClick={page.showMore} />
        </>
    );
}
