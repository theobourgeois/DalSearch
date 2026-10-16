"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, hasSupabase } from "@/lib/supabase/client";

/** The signed-in user, null when signed out, or undefined until the session has loaded. */
export function useUser(): User | null | undefined {
    const [user, setUser] = useState<User | null | undefined>(undefined);

    useEffect(() => {
        if (!hasSupabase) return setUser(null);
        const {
            data: { subscription },
        } = createClient().auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
        return () => subscription.unsubscribe();
    }, []);

    return user;
}

/** "nt123456@dal.ca" -> "nt123456" */
export function displayName(user: User): string {
    return user.email?.split("@")[0] ?? "Account";
}
