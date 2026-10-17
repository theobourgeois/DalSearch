import { redirect } from "next/navigation";
import { Page, PageHeader } from "@/components/layout/page";
import { AdminList } from "@/components/moderation/admin-list";
import { FlaggedReviews } from "@/components/moderation/flagged-reviews";
import { isModerator, requireUser } from "@/lib/auth";
import { universityPath } from "@/lib/university";

export default async function PanelPage({ params }: { params: Promise<{ university: string }> }) {
    const { university } = await params;
    const { supabase, role } = await requireUser(university);
    if (!isModerator(role)) redirect(universityPath(university, "/protected"));

    let admins: { email: string; role: string }[] = [];
    if (role === "owner") {
        const { data, error } = await supabase.from("profiles").select("email, role").eq("role", "admin");
        if (error) console.error("Error fetching admins:", error.message);
        admins = data ?? [];
    }

    return (
        <Page breadcrumbs={[{ label: "Account", href: universityPath(university, "/protected") }, { label: "Moderation" }]}>
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
