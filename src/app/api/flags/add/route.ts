import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { review_id } = await req.json();

  if (!review_id) {
    return NextResponse.json({ error: "review_id is required" }, { status: 400 });
  }

  const { error } = await session.supabase.from("flags").insert({ review_id });

  // 23505: this student already flagged the review, which is fine.
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Review flagged" }, { status: 200 });
}
