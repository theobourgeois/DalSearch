import { redirect } from "next/navigation"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/user-sync"
import OwnerPanel from "@/components/owner-panel";
import AdminPanel from "@/components/admin-panel";

export default async function ProtectedPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/auth/login")
  }

  const user = await currentUser()
  
  // Check if email is verified (Clerk handles this)
  if (user && user.emailAddresses[0]?.verification?.status !== "verified") {
    redirect("/auth/login?error=Please verify your email address before accessing this page.")
  }

  const profile = await getCurrentUserProfile()
  const role = profile?.role ?? "user";

  let admins: { email: string; role: string }[] = [];
  if (role === "owner") {
    const supabase = await createClient()
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
                {role.charAt(0).toUpperCase() + role.slice(1)} Panel
            </h2>
        {profile.role === "owner" && <OwnerPanel admins={admins} />}
        {profile.role === "admin" && <AdminPanel />}
        </section>
    </main>
  
  )
}