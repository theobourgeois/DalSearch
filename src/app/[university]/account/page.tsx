import { redirect } from "next/navigation";
import { universityPath } from "@/lib/university";

export default async function AccountRedirect({ params }: { params: Promise<{ university: string }> }) {
    redirect(universityPath((await params).university, "/protected"));
}
