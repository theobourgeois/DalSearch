"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
    const router = useRouter();

    const logout = async () => {
        await createClient().auth.signOut();
        router.push("/auth/login");
        router.refresh();
    };

    return (
        <Button variant="ghost" size="lg" onClick={logout}>
            Sign out
        </Button>
    );
}
