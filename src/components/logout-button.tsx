"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useHref } from "@/components/university";

export function LogoutButton() {
    const pagePath = useHref();
    const router = useRouter();

    const logout = async () => {
        await createClient().auth.signOut();
        router.push(pagePath("/auth/login"));
        router.refresh();
    };

    return (
        <Button variant="ghost" size="lg" onClick={logout}>
            Sign out
        </Button>
    );
}
