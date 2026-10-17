import type { Metadata } from "next";
import { InstructorsView } from "@/components/instructors/instructors-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCurrentTerm, getInstructorList, getSubjects } from "@/lib/data";

export const metadata: Metadata = {
    title: "Instructors - DalSearch",
    description: "Compare instructors by RateMyProfessors rating, difficulty and the courses they teach.",
};

export default async function InstructorsPage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const [instructors, subjects] = await Promise.all([
        getInstructorList(university, await getCurrentTerm(university)),
        getSubjects(university),
    ]);
    const rated = instructors.filter((instructor) => instructor.rating !== null).length;

    return (
        <Page breadcrumbs={[{ label: "Instructors" }]}>
            <PageHeader
                title="Instructors"
                description={`${formatNumber(instructors.length)} instructors, ${formatNumber(rated)} of them rated on RateMyProfessors.`}
            />
            <InstructorsView instructors={instructors} subjects={subjects} />
        </Page>
    );
}
