import { HomeSearch } from "@/components/home/home-search";
import { RecentlyViewed } from "@/components/home/recently-viewed";
import { Today } from "@/components/home/today";
import { Page, PageHeader } from "@/components/layout/page";
import { formatNumber } from "@/lib/utils";
import { getCourseIndex } from "@/lib/data";

export default async function HomePage() {
    const courses = await getCourseIndex();
    return (
        <Page breadcrumbs={[{ label: "Home" }]}>
            <PageHeader
                title="Find a course"
                description={`Search ${formatNumber(courses.length)} courses by code, title or subject.`}
            />
            <HomeSearch />
            <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-14">
                <Today />
                <RecentlyViewed />
            </div>
        </Page>
    );
}
