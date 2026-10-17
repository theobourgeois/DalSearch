import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { getExamSchedule } from "@/lib/data";

export const metadata: Metadata = {
    title: "Your schedule - DalSearch",
    description: "Plan your Dalhousie timetable: see your week, catch clashes and export your schedule.",
};

export default async function SchedulePage() {
    return (
        <Page breadcrumbs={[{ label: "Schedule" }]}>
            <ScheduleView exams={await getExamSchedule()} />
        </Page>
    );
}
