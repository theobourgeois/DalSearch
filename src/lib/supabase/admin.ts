import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * A server-side client with the secret key, which bypasses row level security. Only for work the
 * server has already authorized, such as saving a checked upload or publishing an approved one.
 */
export function adminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY");
    return createClient(url, key, { auth: { persistSession: false } });
}
