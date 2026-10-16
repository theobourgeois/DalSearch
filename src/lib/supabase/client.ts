import { createBrowserClient } from "@supabase/ssr"

/** False in local setups without Supabase keys, where accounts and reviews are switched off. */
export const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )
}
