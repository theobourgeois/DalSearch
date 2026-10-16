import { redirect } from "next/navigation";
import { Page, PageHeader } from "@/components/layout/page";
import { AdminList } from "@/components/moderation/admin-list";
import { FlaggedReviews } from "@/components/moderation/flagged-reviews";
import { requireVerifiedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/user-sync";

export default async function PanelPage() {
    await requireVerifiedUser();
    const profile = await getCurrentUserProfile();
    const role = profile?.role ?? "user";
    if (role === "user") redirect("/protected");

    let admins: { email: string; role: string }[] = [];
    if (role === "owner") {
        const supabase = await createClient();
        const { data, error } = await supabase.from("profiles").select("email, role").eq("role", "admin");
        if (error) console.error("Error fetching admins:", error.message);
        admins = data ?? [];
    }

    return (
        <Page breadcrumbs={[{ label: "Account", href: "/protected" }, { label: "Moderation" }]}>
            <PageHeader
                title="Moderation"
                description={
                    role === "owner" ? "Manage admins and flagged reviews." : "Review what students have flagged."
                }
            />
            {role === "owner" && <AdminList admins={admins} />}
            <FlaggedReviews />
        </Page>
    );
}
