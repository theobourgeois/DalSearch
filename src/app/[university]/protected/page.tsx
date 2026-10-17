import Link from "next/link";
import { Page, PageActions, PageHeader } from "@/components/layout/page";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { isModerator, requireUser } from "@/lib/auth";
import { universityPath } from "@/lib/university";
import { privatePage } from "@/lib/seo";


export const metadata = privatePage;

export default async function AccountPage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const { user, role } = await requireUser(university);

    return (
        <Page breadcrumbs={[{ label: "Account" }]}>
            <PageHeader title="Account" description={user.email} />
            <PageActions>
                <Button asChild variant="primary" size="lg">
                    <Link href={universityPath(university, "/reviews")}>My reviews</Link>
                </Button>
                {isModerator(role) && (
                    <Button asChild variant="outline" size="lg">
                        <Link href={universityPath(university, "/panel")}>Moderation</Link>
                    </Button>
                )}
                <LogoutButton />
            </PageActions>
        </Page>
    );
}
