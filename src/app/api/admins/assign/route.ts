import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("email", String(email).trim().toLowerCase())
    .eq("role", "user")
    .select("email, role");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "No student account uses that email" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
