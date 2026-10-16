import type { Metadata } from "next";
import { InstructorsView } from "@/components/instructors/instructors-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCurrentTerm, getInstructorList, subjects } from "@/lib/data";

export const metadata: Metadata = {
    title: "Instructors - DalSearch",
    description: "Compare Dalhousie instructors by RateMyProfessors rating, difficulty and the courses they teach.",
};

export default function InstructorsPage() {
    const instructors = getInstructorList(getCurrentTerm());
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
