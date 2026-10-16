import Link from "next/link";
import { Page, PageActions, PageHeader } from "@/components/layout/page";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { isModerator, requireUser } from "@/lib/auth";

export default async function AccountPage() {
    const { user, role } = await requireUser();

    return (
        <Page breadcrumbs={[{ label: "Account" }]}>
            <PageHeader title="Account" description={user.email} />
            <PageActions>
                <Button asChild variant="primary" size="lg">
                    <Link href="/reviews">My reviews</Link>
                </Button>
                {isModerator(role) && (
                    <Button asChild variant="outline" size="lg">
                        <Link href="/panel">Moderation</Link>
                    </Button>
                )}
                <LogoutButton />
            </PageActions>
        </Page>
    );
}
