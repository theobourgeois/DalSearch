"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout/page";
import { useCurrentTerm, useTerms } from "@/components/current-term";
import { ConflictNotice } from "@/components/schedule/conflict-notice";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dot } from "@/components/ui/status";
import { useCampusNow } from "@/hooks/use-campus-now";
import { useTermSchedule } from "@/hooks/use-term-schedule";
import { dayNames } from "@/lib/constants";
import { formatCourseCode, sessionName } from "@/lib/schedule";
import { formatDuration, formatMinutes, isTimed, toMinutes, type TimedSession } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useHref } from "@/components/university";

const MIN_GAP = 30;

type AgendaItem =
    { kind: "class"; session: TimedSession; start: number; end: number } | { kind: "gap"; start: number; end: number };

function buildAgenda(sessions: TimedSession[], now: number): AgendaItem[] {
    const classes = sessions
        .map((session) => ({
            kind: "class" as const,
            session,
            start: toMinutes(session.time.start),
            end: toMinutes(session.time.end),
        }))
        .sort((a, b) => a.start - b.start);
    const items: AgendaItem[] = [];
    classes.forEach((item, index) => {
        const previous = classes[index - 1];
        if (previous && item.start - previous.end >= MIN_GAP && now >= previous.end && now < item.start) {
            items.push({ kind: "gap", start: now, end: item.start });
        }
        items.push(item);
    });
    return items;
}

function Row({
    time,
    children,
    aside,
    state,
}: {
    time: string;
    children: React.ReactNode;
    aside?: React.ReactNode;
    state?: "past" | "now";
}) {
    return (
        <li
            className={cn(
                "grid min-h-[3.75rem] grid-cols-[3.25rem_1fr_auto] items-center gap-3.5 rounded-row px-4 py-2.5",
                state === "now" && "bg-raised",
                state === "past" && "opacity-50",
            )}
        >
            <span className={cn("text-sm font-bold", state === "now" ? "text-fg" : "text-fg-muted")}>{time}</span>
            <div className="min-w-0">{children}</div>
            {aside && <div className="text-[13.5px] font-medium text-fg-subtle">{aside}</div>}
        </li>
    );
}

/** Today's classes from the current term, with the class in progress or the free gap you're in. */
export function Today() {
    const pagePath = useHref();
    const { label: termLabel } = useTerms();
    const currentTerm = useCurrentTerm();
    const { ready, sessions, colors, conflicts } = useTermSchedule(currentTerm);
    const now = useCampusNow();
    if (!ready || !now) return null;

    const today = now.day ? sessions.filter(isTimed).filter((session) => session.days.includes(now.day!)) : [];
    const agenda = buildAgenda(today, now.minutes);

    return (
        <section>
            <SectionHeader title="Today">
                <span className="text-sm font-medium text-fg-subtle">
                    {now.day ? dayNames[now.day].long : "Weekend"}
                </span>
            </SectionHeader>

            {sessions.length === 0 ? (
                <EmptyState
                    className="mt-4 py-8"
                    title={`Nothing in ${termLabel(currentTerm)} yet`}
                    description="Add courses and your day will show up here."
                />
            ) : agenda.length === 0 ? (
                <p className="mt-4 rounded-card bg-raised px-5 py-4 text-sm font-medium text-fg-muted">
                    No classes today.
                </p>
            ) : (
                <ul className="mt-3.5 flex flex-col">
                    {agenda.map((item) => {
                        if (item.kind === "gap") {
                            return (
                                <Row
                                    key={`gap-${item.end}`}
                                    time={formatMinutes(item.start)}
                                    state="now"
                                    aside={
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={pagePath("/rooms")}>Find a free room</Link>
                                        </Button>
                                    }
                                >
                                    <p className="text-[14.5px] font-bold">Free until {formatMinutes(item.end)}</p>
                                    <p className="text-[13px] text-fg-subtle">
                                        {formatDuration(item.end - item.start)} before your next class
                                    </p>
                                </Row>
                            );
                        }
                        const { session } = item;
                        const state = now.minutes >= item.end ? "past" : now.minutes >= item.start ? "now" : undefined;
                        return (
                            <Row
                                key={`${session.crn}-${item.start}`}
                                time={formatMinutes(item.start)}
                                state={state}
                                aside={
                                    state === "past"
                                        ? "Done"
                                        : state === "now"
                                          ? `${formatDuration(item.end - now.minutes)} left`
                                          : undefined
                                }
                            >
                                <Link
                                    href={pagePath(`/${session.course}`)}
                                    className="flex items-center gap-2 text-[14.5px] font-bold hover:underline"
                                >
                                    <Dot color={colors[session.course]} />
                                    {formatCourseCode(session.course)}
                                    <span className="font-medium text-fg-muted">{sessionName(session)}</span>
                                </Link>
                                <p className="pl-4 text-[13px] text-fg-subtle">{session.location}</p>
                            </Row>
                        );
                    })}
                </ul>
            )}

            {conflicts.length > 0 && (
                <ConflictNotice
                    className="mt-4"
                    conflicts={conflicts}
                    action={
                        <Button asChild size="sm" variant="outline">
                            <Link href={pagePath("/schedule")}>Review</Link>
                        </Button>
                    }
                />
            )}
        </section>
    );
}
