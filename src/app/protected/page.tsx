import { redirect } from "next/navigation"
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/server"

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  const {data: { user },} = await supabase.auth.getUser();
  
  // Check if email is confirmed
  if (user && !user.email_confirmed_at) {
    redirect("/auth/login?error=Please confirm your email address before accessing this page.")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  const role = profile?.role ?? "user";

  return (
    <main className="flex justify-center">
        <section className="w-full sm:w-10/12 sm:m-8 m-2">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                My Account
            </h2>
            <p>
              Email: <span>{data.claims.email}</span>
            </p>
            <div className="flex space-x-4 mt-4">
          <LogoutButton />

          <Link
            href="/reviews"
            className="rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-gray-300 bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 dark:text-gray-900 h-9 px-4 py-2 rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300"
          >
            My Reviews
          </Link>

          {(role !== "user") && (
          <Link
            href={`/panel`}
            className="rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-gray-300 bg-gray-900 text-gray-50 shadow hover:bg-gray-900/90 dark:text-gray-900 h-9 px-4 py-2 rounded-xl dark:bg-yellow-400 dark:hover:bg-yellow-300"
          >
            {role.charAt(0).toUpperCase() + role.slice(1)} Panel
          </Link>
          )}
        </div>
        </section>
    </main>
  
  )
}