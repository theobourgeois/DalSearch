import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { adminClient } from "@/lib/supabase/admin";
import { CODE_MINUTES, hashCode, newCode, sendCode, universityForEmail } from "@/lib/university-email";

/** One code a minute per address, so the button can't be used to spam someone's inbox. */
const RESEND_AFTER_MS = 60_000;

/**
 * Emails a code to another university address of the signed-in student ({ email }), so a student
 * cross-registered at a second school can review its courses once they enter it.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { email: raw } = await request.json();
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter an email address." }, { status: 400 });
  }
  const university = await universityForEmail(email);
  if (!university) {
    return NextResponse.json({ error: "That isn't an email address from a university on Termly." }, { status: 400 });
  }

  const admin = adminClient();
  const userId = session.user.id;
  const { data: already } = await admin
    .from("student_universities")
    .select("university_id")
    .eq("user_id", userId)
    .eq("university_id", university.id)
    .maybeSingle();
  if (already) return NextResponse.json({ university: university.id, verified: true });

  const { data: previous } = await admin
    .from("university_email_codes")
    .select("created_at")
    .eq("user_id", userId)
    .eq("email", email)
    .maybeSingle();
  if (previous && Date.now() - new Date(previous.created_at).getTime() < RESEND_AFTER_MS) {
    return NextResponse.json({ error: "We just sent a code. Wait a minute before asking for another." }, { status: 429 });
  }

  const code = newCode();
  const { error } = await admin.from("university_email_codes").upsert({
    user_id: userId,
    email,
    university_id: university.id,
    code_hash: hashCode(userId, code),
    attempts: 0,
    expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
    created_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "Couldn't create a code. Try again." }, { status: 500 });

  try {
    await sendCode(email, code, university);
  } catch (sendError) {
    console.error("Couldn't send a university email code", sendError);
    return NextResponse.json({ error: "Couldn't send the email. Try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ university: university.id, verified: false });
}
