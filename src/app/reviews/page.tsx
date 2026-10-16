import { Page, PageHeader } from "@/components/layout/page";
import { MyReviews } from "@/components/reviews/my-reviews";
import { requireUser } from "@/lib/auth";

export default async function MyReviewsPage() {
    const { user } = await requireUser();

    return (
        <Page breadcrumbs={[{ label: "Account", href: "/protected" }, { label: "My reviews" }]}>
            <PageHeader title="My reviews" />
            <MyReviews userId={user.id} />
        </Page>
    );
}
