import { NextResponse } from "next/server";
import { getSession, isModerator } from "@/lib/auth";

/** Dismisses the flags on one of the site's reviews ({ review_id }) or a RateMyProfessors one ({ external_review_id }). */
export async function POST(req: Request) {
  const session = await getSession();

  if (!session || !isModerator(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { review_id, external_review_id } = await req.json();

  if (!review_id === !external_review_id) {
    return NextResponse.json({ error: "Send review_id or external_review_id" }, { status: 400 });
  }

  const { data, error } = review_id
    ? await session.supabase.from("flags").delete().eq("review_id", review_id).select()
    : await session.supabase
        .from("external_review_flags")
        .delete()
        .eq("external_review_id", external_review_id)
        .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Flags ignored for review", cleared: data },
    { status: 200 }
  );
}
