import type { Metadata } from "next";
import { InstructorsView } from "@/components/instructors/instructors-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCurrentTerm, getInstructorList, getSubjects } from "@/lib/data";
import { universityPageMetadata } from "@/lib/seo";
import { getUniversity } from "@/lib/university";

export async function generateMetadata({ params }: { params: Promise<{ university: string }> }): Promise<Metadata> {
    const { university } = await params;
    const { name } = getUniversity(university)!;
    return universityPageMetadata(university, "/instructors", {
        title: `${name} instructors and ratings`,
        description: `Compare ${name} instructors by RateMyProfessors rating and difficulty, and see the courses each one teaches this term.`,
    });
}

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
