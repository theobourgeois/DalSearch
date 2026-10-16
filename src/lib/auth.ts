import "server-only";

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

/** The signed-in, verified user for account pages; anyone else is sent to the login page. */
export async function requireVerifiedUser() {
    const { userId } = await auth();
    if (!userId) redirect("/auth/login");

    const user = await currentUser();
    if (user && user.emailAddresses[0]?.verification?.status !== "verified") {
        redirect("/auth/login?error=Please verify your email address before accessing this page.");
    }
    return { userId, user };
}
