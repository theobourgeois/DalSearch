"use client";

import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();
    const { signOut } = useClerk();

    const logout = async () => {
        await signOut();
        router.push("/auth/login");
    };

    return (
        <Button variant="ghost" size="lg" onClick={logout}>
            Sign out
        </Button>
    );
}
