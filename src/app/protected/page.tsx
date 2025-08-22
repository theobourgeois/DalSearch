import { redirect } from "next/navigation"

import { LogoutButton } from "@/components/logout-button"
import { createClient } from "@/lib/supabase/server"

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  return (
    <main className="flex justify-center">
        <section className="w-full sm:w-10/12 sm:m-8 m-2">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                My Account
            </h2>
            <p>
              Hello <span>{data.claims.email}</span>
            </p>
            <LogoutButton />
        </section>
    </main>
  
  )
}