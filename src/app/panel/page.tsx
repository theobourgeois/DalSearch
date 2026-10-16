import { redirect } from "next/navigation";
import { Page, PageHeader } from "@/components/layout/page";
import { AdminList } from "@/components/moderation/admin-list";
import { FlaggedReviews } from "@/components/moderation/flagged-reviews";
import { isModerator, requireUser } from "@/lib/auth";

export default async function PanelPage() {
    const { supabase, role } = await requireUser();
    if (!isModerator(role)) redirect("/protected");

    let admins: { email: string; role: string }[] = [];
    if (role === "owner") {
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
