"use client";

import { forwardRef } from "react";
import { PageColumns } from "@/components/layout/page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarEvent } from "@/lib/calendar";
import type { CampusNow } from "@/lib/time";
import { DayList } from "./day-list";
import { WeekCalendar } from "./week-calendar";

export type CalendarView = "week" | "list";

type CalendarTabsProps = {
    events: CalendarEvent[];
    /** The details column beside the calendar. */
    aside: React.ReactNode;
    /** Shown above the calendar in both views, e.g. a clash notice or section heading. */
    header?: React.ReactNode;
    view: CalendarView;
    onViewChange: (view: CalendarView) => void;
    now?: CampusNow;
    pxPerMinute?: number;
};

/** Week and List views of the same events, with a details column; the ref points at the week calendar. */
export const CalendarTabs = forwardRef<HTMLDivElement, CalendarTabsProps>(
    ({ events, aside, header, view, onViewChange, now, pxPerMinute }, ref) => (
        <Tabs value={view} onValueChange={(value) => onViewChange(value as CalendarView)} className="mt-8">
            <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
            <PageColumns aside={aside}>
                {header}
                <TabsContent value="week" className="mt-5">
                    <WeekCalendar ref={ref} events={events} now={now} showCounts pxPerMinute={pxPerMinute} />
                </TabsContent>
                <TabsContent value="list" className="mt-2">
                    <DayList events={events} />
                </TabsContent>
            </PageColumns>
        </Tabs>
    ),
);
CalendarTabs.displayName = "CalendarTabs";
