"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarTabs, type CalendarView } from "@/components/calendar/calendar-tabs";
import { AsideDivider, AsideHeading, SectionHeader } from "@/components/layout/page";
import { Property, PropertyList } from "@/components/ui/property-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useTermSchedule } from "@/hooks/use-term-schedule";
import type { CalendarEvent } from "@/lib/calendar";
import { dayNames, termLabel, termOptions, type Term } from "@/lib/constants";
import { parseLocation } from "@/lib/location";
import { describeFreeUntil, roomBookings, type FreeRoom, type RoomStatus } from "@/lib/rooms";
import { formatCourseCode, sessionName, weekShape } from "@/lib/schedule";
import { formatMinutes } from "@/lib/time";
import type { ClassSession } from "@/lib/types";
import { FreeRoomList, roomHref } from "./room-links";

type RoomScheduleProps = {
    room: string;
    sessions: ClassSession[];
    term: Term;
    status: RoomStatus | null;
    freeWindows: [number, number][];
    freeRooms: FreeRoom[];
};

function StatusLine({ status, windows }: { status: RoomStatus; windows: [number, number][] }) {
    const later = status.state === "busy" ? windows.find(([start]) => start >= status.until) : undefined;
    return (
        <>
            <div className="flex gap-3">
                <span
                    className={`mt-1.5 size-2.5 shrink-0 rounded-full ${status.state === "busy" ? "bg-danger" : "bg-success"}`}
                />
                <div>
                    <p className="text-[15px] font-bold">
                        {status.state === "busy"
                            ? `In use until ${formatMinutes(status.until)}`
                            : describeFreeUntil(status.until)}
                    </p>
                    {status.state === "busy" && (
                        <p className="text-[13.5px] font-medium text-fg-muted">
                            {formatCourseCode(status.session.course)} {sessionName(status.session)}
                        </p>
                    )}
                </div>
            </div>
            {later && (
                <p className="mt-2.5 text-[13.5px] font-medium text-fg-subtle">
                    Free again at {formatMinutes(later[0])} today.
                </p>
            )}
        </>
    );
}

/** A room's week: who books it, which of your classes meet there, and nearby free rooms. */
export function RoomSchedule({ room, sessions, term, status, freeWindows, freeRooms }: RoomScheduleProps) {
    const router = useRouter();
    const [view, setView] = useState<CalendarView>("week");
    const { colors, sessions: mine } = useTermSchedule(term);
    const myCrns = new Set(mine.map((session) => session.crn));
    const shape = weekShape(sessions);
    const campus = parseLocation(room).campus;

    const events: CalendarEvent[] = roomBookings(sessions).map((booking) => {
        const own = booking.sessions.find((session) => myCrns.has(session.crn));
        const [first, ...others] = booking.courses;
        return {
            id: booking.id,
            day: booking.day,
            start: booking.start,
            end: booking.end,
            title: formatCourseCode(own?.course ?? first),
            lines: [
                own
                    ? "Your class"
                    : others.length > 0
                      ? `and ${others.map(formatCourseCode).join(", ")}`
                      : sessionName(booking.sessions[0]),
            ],
            variant: own ? "tinted" : "neutral",
            color: own ? colors[own.course] : undefined,
            href: `/${own?.course ?? first}`,
        };
    });

    const busiest = shape
        ? [...shape.classesPerDay.entries()]
              .filter(([, count]) => count === shape.busiestCount)
              .map(([day]) => dayNames[day].short)
        : [];

    return (
        <CalendarTabs
            events={events}
            view={view}
            onViewChange={setView}
            header={
                <SectionHeader title={`Booked in ${termLabel(term)}`}>
                    <SegmentedControl<Term>
                        aria-label="Term"
                        value={term}
                        onValueChange={(next) => router.push(roomHref(room, next))}
                        options={termOptions()}
                    />
                </SectionHeader>
            }
            aside={
                <>
                    {status && (
                        <>
                            <AsideHeading>Right now</AsideHeading>
                            <StatusLine status={status} windows={freeWindows} />
                            <AsideDivider />
                            <AsideHeading>Free right now nearby</AsideHeading>
                            <FreeRoomList rooms={freeRooms} term={term} />
                            <AsideDivider />
                        </>
                    )}
                    <PropertyList>
                        <Property label="Classes">{`${new Set(sessions.map((session) => session.crn)).size} this term`}</Property>
                        {busiest.length > 0 && <Property label="Busiest days">{busiest.join(", ")}</Property>}
                        {campus && <Property label="Campus">{campus}</Property>}
                    </PropertyList>
                </>
            }
        />
    );
}
