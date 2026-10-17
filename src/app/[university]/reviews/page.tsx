import { Page, PageHeader } from "@/components/layout/page";
import { MyReviews } from "@/components/reviews/my-reviews";
import { requireUser } from "@/lib/auth";
import { universityPath } from "@/lib/university";

export default async function MyReviewsPage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const { user } = await requireUser(university);

    return (
        <Page breadcrumbs={[{ label: "Account", href: universityPath(university, "/protected") }, { label: "My reviews" }]}>
            <PageHeader title="My reviews" />
            <MyReviews userId={user.id} university={university} />
        </Page>
    );
}
