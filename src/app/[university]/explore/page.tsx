import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreView } from "@/components/explore/explore-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCourseList, getCreditHourOptions, getRatingsByName, getSubjects } from "@/lib/data";

export const metadata: Metadata = {
    title: "Explore courses - DalSearch",
    description:
        "Browse every course by term, subject, level and credits, and see which ones fit your schedule.",
};

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
                <ExploreView
                    courses={courses}
                    subjects={subjects}
                    creditHours={creditHours}
                    ratings={ratings}
                />
            </Suspense>
        </Page>
    );
}
