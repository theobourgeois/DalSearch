import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { hashCode, MAX_ATTEMPTS, sameHash } from "@/lib/university-email";

/** Checks the code sent to a university address ({ email, code }) and, if it's right, records the school. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { email: raw, code: rawCode } = await request.json();
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const code = typeof rawCode === "string" ? rawCode.replace(/\s/g, "") : "";
  const admin = adminClient();
  const userId = session.user.id;

  const { data: pending } = await admin
    .from("university_email_codes")
    .select("university_id, code_hash, attempts, expires_at")
    .eq("user_id", userId)
    .eq("email", email)
    .maybeSingle();
  if (!pending || new Date(pending.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired. Send a new one." }, { status: 400 });
  }
  if (pending.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many tries. Send a new code." }, { status: 429 });
  }
  if (!sameHash(pending.code_hash, hashCode(userId, code))) {
    await admin
      .from("university_email_codes")
      .update({ attempts: pending.attempts + 1 })
      .eq("user_id", userId)
      .eq("email", email);
    return NextResponse.json({ error: "That code isn't right. Check the email and try again." }, { status: 400 });
  }

  const { error } = await admin
    .from("student_universities")
    .upsert({ user_id: userId, university_id: pending.university_id, email });
  if (error) return NextResponse.json({ error: "Couldn't save that. Try again." }, { status: 500 });
  await admin.from("university_email_codes").delete().eq("user_id", userId).eq("email", email);
  return NextResponse.json({ university: pending.university_id });
}
