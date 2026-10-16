import { Page, PageHeader } from "@/components/layout/page";
import { MyReviews } from "@/components/reviews/my-reviews";
import { requireVerifiedUser } from "@/lib/auth";

export default async function MyReviewsPage() {
    const { userId } = await requireVerifiedUser();

    return (
        <Page breadcrumbs={[{ label: "Account", href: "/protected" }, { label: "My reviews" }]}>
            <PageHeader title="My reviews" />
            <MyReviews userId={userId} />
        </Page>
    );
}
