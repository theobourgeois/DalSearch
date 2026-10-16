"use client";

import { useState } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Property, PropertyList } from "@/components/ui/property-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { termLabel } from "@/lib/constants";
import { cleanInstructorName } from "@/lib/instructors";
import {
    formatWeight,
    preferredSyllabus,
    syllabusTerm,
    syllabusUrl,
    teachesFrom,
    type GradingScheme,
    type Syllabus,
    type Textbook,
} from "@/lib/syllabi";
import { useCourse } from "./course-context";

function Subheading({ children }: { children: React.ReactNode }) {
    return <h3 className="mb-2 mt-7 text-[13px] font-bold text-fg-subtle">{children}</h3>;
}

function Grading({ schemes }: { schemes: GradingScheme[] }) {
    const [index, setIndex] = useState("0");
    const scheme = schemes[Number(index)] ?? schemes[0];

    return (
        <>
            <Subheading>Grading</Subheading>
            {schemes.length > 1 && (
                <SegmentedControl
                    aria-label="Grading scheme"
                    className="mb-3"
                    value={index}
                    onValueChange={setIndex}
                    options={schemes.map((option, i) => ({
                        value: String(i),
                        label: option.label?.slice(0, 40) || `Scheme ${i + 1}`,
                    }))}
                />
            )}
            <div className="max-w-[42rem]">
                {scheme.components.map((component, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-x-4 border-b border-line py-2.5 last:border-b-0"
                    >
                        <span className="text-[15px] font-black tabular-nums">
                            {component.weight !== null ? formatWeight(component.weight) : ""}
                        </span>
                        <span className="min-w-0">
                            <span className="text-[15px] font-bold">
                                {component.name}
                                {component.count !== null && component.count > 1 && (
                                    <span className="font-medium text-fg-muted"> ({component.count})</span>
                                )}
                            </span>
                            {component.note && (
                                <span className="block text-[13px] text-fg-subtle">{component.note}</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </>
    );
}

function describeTextbook(book: Textbook): string | null {
    const facts = [book.required === false && "optional", book.free && "free"].filter(Boolean);
    return facts.length ? facts.join(", ") : null;
}

function Textbooks({ books }: { books: Textbook[] }) {
    return (
        <>
            <Subheading>{books.length === 1 ? "Textbook" : "Textbooks"}</Subheading>
            <ul className="flex max-w-[42rem] flex-col gap-2">
                {books.map((book, i) => {
                    const facts = describeTextbook(book);
                    return (
                        <li key={i} className="text-[15px] font-medium leading-snug text-fg-body">
                            <span className="font-bold text-fg">{book.title}</span>
                            {book.authors && <span>, {book.authors}</span>}
                            {facts && <span className="text-fg-subtle"> ({facts})</span>}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

function WeeklyTopics({ topics }: { topics: Syllabus["weekly_topics"] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-6">
            <Button variant="link" className="font-bold" onClick={() => setOpen(!open)} aria-expanded={open}>
                {open ? "Hide weekly topics" : `Show weekly topics (${topics.length})`}
            </Button>
            {open && (
                <div className="mt-3 max-w-[42rem]">
                    {topics.map((week, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 border-b border-line py-2 text-sm last:border-b-0"
                        >
                            <span className="font-medium text-fg-subtle">{week.when}</span>
                            <span className="font-medium text-fg-body">{week.topic}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const listNames = (names: string[]) => new Intl.ListFormat("en", { type: "conjunction" }).format(names);

const syllabusName = (syllabus: Syllabus) =>
    [syllabusTerm(syllabus), syllabus.instructors.slice(0, 2).join(" and ")].filter(Boolean).join(", ");

/**
 * "From the syllabus" on the Overview tab: grading, textbooks and course rules from a public syllabus,
 * preferring one by someone who teaches the term on the page.
 */
export function CourseSyllabus({ syllabi }: { syllabi: Syllabus[] }) {
    const { course, term } = useCourse();
    const teaching = [
        ...new Set(
            (course.instructorsByTerm[term] ?? [])
                .map(cleanInstructorName)
                .filter((name): name is string => Boolean(name)),
        ),
    ];
    const [picked, setPicked] = useState<string | null>(null);

    if (syllabi.length === 0) return null;

    const syllabus = syllabi.find((option) => option.id === picked) ?? preferredSyllabus(syllabi, teaching)!;
    const schemes = syllabus.grading_schemes.filter((scheme) => scheme.components.length > 0);
    const otherInstructor = teaching.length > 0 && !teachesFrom(syllabus, teaching);

    return (
        <section className="mt-11">
            <SectionHeader title="From the syllabus">
                {syllabi.length > 1 && (
                    <Select value={syllabus.id} onValueChange={setPicked}>
                        <SelectTrigger aria-label="Choose a syllabus" className="h-9 w-auto min-w-48 rounded-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            {syllabi.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {syllabusName(option)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </SectionHeader>
            <p className="mt-1.5 max-w-[42rem] text-[13px] text-fg-subtle">
                From the {syllabusTerm(syllabus)} syllabus
                {syllabus.instructors.length > 0 && ` by ${listNames(syllabus.instructors)}`}.
                {otherInstructor && ` ${termLabel(term)} is taught by ${listNames(teaching)}, so details may differ.`}{" "}
                <a
                    href={syllabusUrl(syllabus)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 font-bold text-fg-muted hover:text-fg"
                >
                    Open the PDF
                    <ArrowUpRightIcon className="size-3.5" />
                </a>
            </p>

            {schemes.length > 0 && <Grading key={`grading-${syllabus.id}`} schemes={schemes} />}
            {syllabus.textbooks.length > 0 && <Textbooks books={syllabus.textbooks} />}
            {syllabus.policies.length > 0 && (
                <>
                    <Subheading>Course rules</Subheading>
                    <PropertyList className="max-w-[42rem]">
                        {syllabus.policies.map((policy, i) => (
                            <Property key={i} label={policy.topic}>
                                {policy.summary}
                            </Property>
                        ))}
                    </PropertyList>
                </>
            )}
            {syllabus.weekly_topics.length > 0 && <WeeklyTopics key={`topics-${syllabus.id}`} topics={syllabus.weekly_topics} />}
        </section>
    );
}
