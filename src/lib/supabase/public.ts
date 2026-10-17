import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * A server-side client for public tables that every visitor sees the same way. No cookies, so pages
 * that use it stay cached.
 */
export function publicClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY");
    return createClient(url, key, { auth: { persistSession: false } });
}
