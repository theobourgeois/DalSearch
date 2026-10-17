import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreView } from "@/components/explore/explore-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCourseList, getCreditHourOptions, getRatingsByName, getSubjects } from "@/lib/data";
import { universityPageMetadata } from "@/lib/seo";
import { getUniversity } from "@/lib/university";

export async function generateMetadata({ params }: { params: Promise<{ university: string }> }): Promise<Metadata> {
    const { university } = await params;
    const { name } = getUniversity(university)!;
    return universityPageMetadata(university, "/explore", {
        title: `${name} courses by subject and term`,
        description: `Browse every ${name} course by term, subject, level and credits, with seats and instructor ratings, and see which ones fit your schedule.`,
    });
}

export default async function ExplorePage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const [courses, subjects, creditHours, ratings] = await Promise.all([
        getCourseList(university),
        getSubjects(university),
        getCreditHourOptions(university),
        getRatingsByName(university),
    ]);

    return (
        <Page breadcrumbs={[{ label: "Explore" }]}>
            <PageHeader
                title="Explore"
                description={`${formatNumber(courses.length)} courses across ${subjects.length} subjects.`}
            />
            <Suspense>
                <ExploreView courses={courses} subjects={subjects} creditHours={creditHours} ratings={ratings} />
            </Suspense>
        </Page>
    );
}
