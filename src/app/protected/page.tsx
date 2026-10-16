import Link from "next/link";
import { Page, PageActions, PageHeader } from "@/components/layout/page";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { requireVerifiedUser } from "@/lib/auth";
import { getCurrentUserProfile } from "@/lib/user-sync";

export default async function AccountPage() {
    const { user } = await requireVerifiedUser();
    const profile = await getCurrentUserProfile();
    const role = profile?.role ?? "user";

    return (
        <Page breadcrumbs={[{ label: "Account" }]}>
            <PageHeader title="Account" description={user?.emailAddresses[0]?.emailAddress} />
            <PageActions>
                <Button asChild variant="primary" size="lg">
                    <Link href="/reviews">My reviews</Link>
                </Button>
                {role !== "user" && (
                    <Button asChild variant="outline" size="lg">
                        <Link href="/panel">Moderation</Link>
                    </Button>
                )}
                <LogoutButton />
            </PageActions>
        </Page>
    );
}
