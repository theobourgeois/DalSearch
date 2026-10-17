import "server-only";

import { redirect } from "next/navigation";
import { DEFAULT_UNIVERSITY, universityPath } from "./university";
import { createClient } from "@/lib/supabase/server";

/** Lowest to highest, matching the user_role enum in the database. */
export type Role = "user" | "admin" | "owner";

/** The signed-in user, their role and a Supabase client acting as them, or null when signed out. */
export async function getSession() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return { supabase, user, role: (profile?.role ?? "user") as Role };
}

/** The session for account pages; anyone signed out is sent to the university's login page. */
export async function requireUser(university: string = DEFAULT_UNIVERSITY) {
    const session = await getSession();
    if (!session) redirect(universityPath(university, "/auth/login"));
    return session;
}

export const isModerator = (role: Role) => role === "admin" || role === "owner";
