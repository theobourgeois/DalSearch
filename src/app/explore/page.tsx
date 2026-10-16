import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreView } from "@/components/explore/explore-view";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { creditHourOptions, getCourseList, getRatingsByName, subjects } from "@/lib/data";

export const metadata: Metadata = {
    title: "Explore courses - DalSearch",
    description:
        "Browse every Dalhousie course by term, subject, level and credit hours, and see which ones fit your schedule.",
};

export default function ExplorePage() {
    const courses = getCourseList();

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
                    creditHours={creditHourOptions}
                    ratings={getRatingsByName()}
                />
            </Suspense>
        </Page>
    );
}
