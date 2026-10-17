import { HomeSearch } from "@/components/home/home-search";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { Today } from "@/components/home/today";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCourseIndex, getCurrentTerm, getTerms } from "@/lib/data";
import type { Metadata } from "next";
import { universityPageMetadata } from "@/lib/seo";
import { termLabel } from "@/lib/terms";
import { getUniversity } from "@/lib/university";

export async function generateMetadata({ params }: { params: Promise<{ university: string }> }): Promise<Metadata> {
    const { university } = await params;
    const { name, shortName } = getUniversity(university)!;
    const [courses, terms, current] = await Promise.all([
        getCourseIndex(university),
        getTerms(university),
        getCurrentTerm(university),
    ]);
    return universityPageMetadata(university, "/", {
        title: `${name} course search and timetable planner`,
        description: `Search ${formatNumber(courses.length)} ${shortName} courses for ${termLabel(terms, current)}: open seats, who's teaching and their ratings, prerequisites, and a week that shows clashes.`,
    });
}

export default async function HomePage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const courses = await getCourseIndex(university);
    return (
        <Page breadcrumbs={[{ label: "Home" }]}>
            <PageHeader
                title="Find a course"
                description={`Search ${formatNumber(courses.length)} ${getUniversity(university)!.name} courses by code, title or subject.`}
            />
            <HomeSearch />
            <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-14">
                <Today />
                <RecentlyViewed />
            </div>
        </Page>
    );
}
