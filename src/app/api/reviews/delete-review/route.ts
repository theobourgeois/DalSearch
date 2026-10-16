import { NextResponse } from "next/server";
import { getSession, isModerator } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || !isModerator(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { review_id } = await req.json();

  if (!review_id) {
    return NextResponse.json({ error: "review_id is required" }, { status: 400 });
  }

  // The review's flags are deleted with it.
  const { data, error } = await session.supabase
    .from("reviews")
    .delete()
    .eq("id", review_id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Review deleted" }, { status: 200 });
}
