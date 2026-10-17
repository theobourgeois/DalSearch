import type { Metadata } from "next";
import { Page } from "@/components/layout/page";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { getExamSchedule } from "@/lib/data";
import { universityPageMetadata } from "@/lib/seo";
import { getUniversity } from "@/lib/university";

export async function generateMetadata({ params }: { params: Promise<{ university: string }> }): Promise<Metadata> {
    const { university } = await params;
    const { name, shortName } = getUniversity(university)!;
    return universityPageMetadata(university, "/schedule", {
        title: `${shortName} schedule builder`,
        description: `Plan your ${name} timetable: add sections, see your week and any clashes, and export it to your calendar.`,
    });
}

export default async function SchedulePage({ params }: { params: Promise<{ university: string }> }) {
    return (
        <Page breadcrumbs={[{ label: "Schedule" }]}>
            <ScheduleView exams={await getExamSchedule((await params).university)} />
        </Page>
    );
}
