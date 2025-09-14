import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OwnerPanel from "@/components/owner-panel";
import AdminPanel from "@/components/admin-panel";

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  const {data: { user },} = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const role = profile?.role ?? "user";

  let admins: { email: string; role: string }[] = [];
  if (role === "owner") {
    const { data: adminsData, error: adminsError } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("role", "admin");

    if (adminsError) console.error("Error fetching admins:", adminsError.message);
    admins = adminsData ?? [];
  }

  return (
    <main className="flex justify-center">
        <section className="w-full sm:w-10/12 sm:m-8 m-2">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                Owner Panel
            </h2>
        {profile.role === "owner" && <OwnerPanel admins={admins} />}
        {profile.role === "admin" && <AdminPanel />}
        </section>
    </main>
  
  )
}