import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { SITE_NAME, SITE_URL } from "./constants";
import { adminClient } from "./supabase/admin";
import { getUniversity, type University } from "./university";

/** How long an emailed code works, and how many guesses it allows. */
export const CODE_MINUTES = 15;
export const MAX_ATTEMPTS = 5;
/** The sender; switch it to an @termly.ca address once that domain is verified in Resend. */
const FROM = process.env.EMAIL_FROM ?? `${SITE_NAME} <noreply@dalsearch.com>`;

export const hashCode = (userId: string, code: string) =>
    createHash("sha256").update(`${userId}:${code}`).digest("hex");

export function sameHash(a: string, b: string): boolean {
    const [left, right] = [Buffer.from(a), Buffer.from(b)];
    return left.length === right.length && timingSafeEqual(left, right);
}

export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** The university an email address belongs to, from its domain, or undefined. */
export async function universityForEmail(email: string): Promise<University | undefined> {
    const domain = email.split("@")[1];
    if (!domain) return undefined;
    const { data } = await adminClient()
        .from("university_email_domains")
        .select("university_id")
        .eq("domain", domain)
        .maybeSingle();
    return data ? getUniversity(data.university_id) : undefined;
}

/** Emails the code through Resend, in the same plain style as the sign-up emails. */
export async function sendCode(email: string, code: string, university: University) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Set RESEND_API_KEY");
    const subject = `Your ${SITE_NAME} code for ${university.shortName}`;
    const text = `Enter ${code} on ${SITE_NAME} to confirm you're a ${university.name} student. It works for ${CODE_MINUTES} minutes.\n\nIf you didn't ask for this, you can ignore this email.`;
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#121214;max-width:440px;margin:0 auto;padding:40px 24px">
<p style="margin:0 0 24px;font-size:17px;font-weight:900;letter-spacing:-0.02em">${SITE_NAME}</p>
<h1 style="margin:0 0 8px;font-size:24px;font-weight:700">Confirm your ${university.shortName} email</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#3a3a40">Enter this code on ${SITE_NAME} to review ${university.name} courses. It works for ${CODE_MINUTES} minutes.</p>
<p style="margin:0 0 24px;padding:18px 0;background:#f3f3f5;border-radius:999px;text-align:center;font-size:30px;font-weight:700;letter-spacing:0.3em">${code}</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#92929a">If you didn't ask for this, you can ignore this email. <a href="${SITE_URL}" style="color:#92929a">${SITE_URL.replace("https://", "")}</a></p>
</div>`;
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: email, subject, text, html }),
    });
    if (!response.ok) throw new Error(`Resend: ${response.status} ${await response.text()}`);
}
