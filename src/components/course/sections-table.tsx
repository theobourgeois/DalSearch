"use client";

import { CheckCircleIcon, CheckIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { CellText, DataList, DataListHeader, DataListRow } from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { formatLocation } from "@/lib/location";
import { formatCourseCode, sessionName, sessionTypeLabel } from "@/lib/schedule";
import { formatDays, formatTimeRange, isTimed } from "@/lib/time";
import type { ClassSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCourse } from "./course-context";
import { CourseTermSwitch } from "./term-switch";

const columns = "2rem minmax(0,1.1fr) minmax(0,0.9fr) minmax(0,0.9fr) minmax(0,1.6fr) 4rem";

function SectionRow({ session }: { session: ClassSession }) {
    const { isSelected, select, clashesFor } = useCourse();
    const selected = isSelected(session);
    const clash = clashesFor(session)[0];
    const timed = isTimed(session);

    return (
        <DataListRow
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            highlighted={selected}
            onClick={() => select(session)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select(session);
                }
            }}
            className={cn(
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
                selected && "text-fg",
            )}
        >
            <span
                className={cn(
                    "grid size-[18px] place-items-center rounded-full",
                    selected ? "bg-accent text-accent-fg" : "border-[1.5px] border-fg-subtle",
                )}
            >
                {selected && <CheckIcon weight="bold" className="size-3" />}
            </span>
            <CellText
                primary={sessionName(session)}
                secondary={
                    clash ? (
                        <span className="text-danger">Clashes with {formatCourseCode(clash.course)}</span>
                    ) : (
                        <span className="md:hidden">
                            {timed ? `${formatDays(session.days)} ${formatTimeRange(session)}` : "Online"}
                        </span>
                    )
                }
            />
            <span className="hidden md:block">{timed ? formatDays(session.days) : "Online"}</span>
            <span className="hidden md:block">{timed ? formatTimeRange(session) : "Self-paced"}</span>
            <span className="hidden truncate md:block">{formatLocation(session.location) || "To be announced"}</span>
            <span className="text-[13px] text-fg-subtle">{session.crn}</span>
        </DataListRow>
    );
}

function SelectionNote() {
    const { selected, clashesFor, otherSessions, setTab, schedule } = useCourse();
    if (!schedule.ready || selected.length === 0) return null;

    const clashes = selected.flatMap((session) => clashesFor(session).map((clash) => ({ session, clash })));
    const otherCourses = new Set(otherSessions.map((session) => session.course)).size;

    return (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 text-sm font-medium text-fg-muted">
            {clashes.length > 0 ? (
                <>
                    <WarningCircleIcon weight="fill" className="size-[18px] text-danger" />
                    <span>
                        {sessionName(clashes[0].session)} clashes with {formatCourseCode(clashes[0].clash.course)}
                        {clashes.length > 1 && ` and ${clashes.length - 1} more`}.
                    </span>
                </>
            ) : (
                <>
                    <CheckCircleIcon weight="fill" className="size-[18px] text-success" />
                    <span>
                        {otherCourses > 0
                            ? `No clashes with your ${otherCourses} other courses.`
                            : "Nothing else in this term yet."}
                    </span>
                </>
            )}
            <Button
                variant="link"
                className="font-bold text-fg underline decoration-fg-subtle"
                onClick={() => setTab("schedule")}
            >
                See your week
            </Button>
            <CopyButton
                variant="ghost"
                size="sm"
                className="ml-auto"
                text={selected.map((session) => session.crn).join(", ")}
            >
                Copy CRNs
            </CopyButton>
        </div>
    );
}

/** Every section in the selected term, with one pick per type (lecture, lab, tutorial, ...). */
export function SectionsTable() {
    const { groups } = useCourse();

    return (
        <section className="mt-11">
            <SectionHeader title="Sections">
                <CourseTermSwitch />
            </SectionHeader>
            {groups.length === 0 ? (
                <EmptyState className="mt-4" title="No sections this term" description="Try another term above." />
            ) : (
                <>
                    <DataList columns={columns} mobileColumns="2rem minmax(0,1fr) auto" className="mt-4">
                        <DataListHeader>
                            <span />
                            <span>Section</span>
                            <span>Days</span>
                            <span>Time</span>
                            <span>Location</span>
                            <span>CRN</span>
                        </DataListHeader>
                        {groups.map(([type, sessions]) => {
                            const label = sessionTypeLabel(type);
                            return (
                                <div key={type} role="radiogroup" aria-label={label}>
                                    <div className="px-4 pb-1 pt-4 text-[13px] font-bold text-fg-subtle">
                                        {label}
                                        {sessions.length > 1 && ", pick one"}
                                    </div>
                                    {sessions.map((session) => (
                                        <SectionRow key={session.crn} session={session} />
                                    ))}
                                </div>
                            );
                        })}
                    </DataList>
                    <SelectionNote />
                </>
            )}
        </section>
    );
}
