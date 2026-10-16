"use client";

import { WeekCalendar } from "@/components/calendar/week-calendar";
import { SectionHeader } from "@/components/layout/page";
import { conflictingMeetings, sessionEvents, type CalendarEvent } from "@/lib/calendar";
import { dayNames } from "@/lib/constants";
import { formatLocation } from "@/lib/location";
import { findConflicts, formatCourseCode, listSessions, sessionName } from "@/lib/schedule";
import { formatDuration, formatMinutes, formatTimeRange, isTimed, toMinutes, weeklyMinutes } from "@/lib/time";
import type { ClassSession, Day } from "@/lib/types";
import { useCourse } from "./course-context";
import { CourseTermSwitch } from "./term-switch";

function Legend() {
    const swatch = "inline-block size-2.5 rounded-full";
    return (
        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-fg-muted">
            <span className="flex items-center gap-1.5">
                <span className={`${swatch} bg-accent`} />
                Your picks
            </span>
            <span className="flex items-center gap-1.5">
                <span className={`${swatch} bg-block ring-1 ring-line-strong`} />
                Your other courses
            </span>
            <span className="flex items-center gap-1.5">
                <span className={`${swatch} border-[1.5px] border-dashed border-fg-subtle`} />
                Other sections
            </span>
        </div>
    );
}

/** The day this course makes longest, with its first and last class. */
function longestDay(sessions: ClassSession[], days: Day[]) {
    const spans = days.map((day) => {
        const meetings = sessions.filter(isTimed).filter((session) => session.days.includes(day));
        const start = Math.min(...meetings.map((session) => toMinutes(session.time.start)));
        const end = Math.max(...meetings.map((session) => toMinutes(session.time.end)));
        return { day, start, end };
    });
    return spans.sort((a, b) => b.end - b.start - (a.end - a.start))[0];
}

function Fact({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <div className="text-[22px] font-black tracking-tight">{value}</div>
            <div className="mt-0.5 text-[13.5px] font-medium text-fg-muted">{label}</div>
        </div>
    );
}

/** The student's week with this course's picked sections placed in it. */
export function CourseWeek() {
    const { code, selected, isSelected, select, otherSessions, schedule, groups } = useCourse();
    const picked = new Set(selected.map((session) => session.crn));
    const newClashes = findConflicts([...otherSessions, ...selected]).filter(
        ({ first, second }) => picked.has(first.crn) || picked.has(second.crn),
    );
    const clashing = conflictingMeetings(newClashes);
    const alternatives = groups.flatMap(([, sessions]) => sessions).filter((session) => !isSelected(session));

    const events: CalendarEvent[] = [
        ...otherSessions.flatMap((session) =>
            sessionEvents(session, (timed, id) => ({
                title: formatCourseCode(session.course),
                lines: [sessionName(session), formatTimeRange(timed)],
                variant: "neutral",
                color: schedule.colors[session.course],
                conflict: clashing.has(id),
                href: `/${session.course}`,
            })),
        ),
        ...alternatives.flatMap((session) =>
            sessionEvents(session, () => ({
                title: sessionName(session),
                lines: ["Switch to this section"],
                variant: "ghost",
                onSelect: () => select(session),
                label: `Switch to ${sessionName(session)}`,
            })),
        ),
        ...selected.flatMap((session) =>
            sessionEvents(session, (timed, id) => ({
                title: sessionName(session),
                lines: [formatTimeRange(timed), formatLocation(session.location)],
                variant: "accent",
                conflict: clashing.has(id),
            })),
        ),
    ];

    const timedPicks = selected.filter(isTimed);
    const pickDays = [...new Set(timedPicks.flatMap((session) => session.days))];
    const busiest = pickDays.length > 0 ? longestDay([...otherSessions, ...selected], pickDays) : undefined;
    const online = selected.filter((session) => !isTimed(session));

    return (
        <section>
            <SectionHeader title={`Your week with ${formatCourseCode(code)}`}>
                <CourseTermSwitch />
            </SectionHeader>
            <Legend />
            <WeekCalendar className="mt-4" events={events} />

            {selected.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-5">
                    <Fact value={`+${formatDuration(weeklyMinutes(selected))}`} label="of class a week" />
                    <Fact
                        value={
                            newClashes.length === 0
                                ? "No new clashes"
                                : `${newClashes.length} new ${newClashes.length === 1 ? "clash" : "clashes"}`
                        }
                        label={
                            newClashes.length === 0
                                ? `${listSessions(selected)} fit your week`
                                : "Pick another section above"
                        }
                    />
                    {busiest && (
                        <Fact
                            value={`${formatMinutes(busiest.start)} to ${formatMinutes(busiest.end)}`}
                            label={`Your ${dayNames[busiest.day].long}s with ${formatCourseCode(code)}`}
                        />
                    )}
                </div>
            )}
            {online.length > 0 && (
                <p className="mt-4 text-[13.5px] font-medium text-fg-subtle">
                    {listSessions(online)} {online.length === 1 ? "is" : "are"} online, so{" "}
                    {online.length === 1 ? "it isn't" : "they aren't"} on the calendar.
                </p>
            )}
        </section>
    );
}
