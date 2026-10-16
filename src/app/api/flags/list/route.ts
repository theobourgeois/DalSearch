import { NextResponse } from "next/server";
import { getSession, isModerator } from "@/lib/auth";
import { RMP_REVIEW_COLUMNS } from "@/lib/rmp-reviews";

export async function GET() {
  const session = await getSession();

  if (!session || !isModerator(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { supabase } = session;

  const [{ data: flagged, error: flagError }, { data: reported, error: reportError }] = await Promise.all([
    supabase.from("flags").select("review_id"),
    supabase.from("external_review_flags").select("external_review_id"),
  ]);

  if (flagError || reportError) {
    return NextResponse.json({ error: (flagError ?? reportError)!.message }, { status: 500 });
  }

  const reviewIds = [...new Set(flagged.map((f) => f.review_id))];
  const externalIds = [...new Set(reported.map((f) => f.external_review_id))];

  const [{ data: reviews, error: reviewError }, { data: externalReviews, error: externalError }] = await Promise.all([
    reviewIds.length
      ? supabase
          .from("reviews")
          .select("id, course_code, instructor, review_text, rating, difficulty, workload, created_at")
          .in("id", reviewIds)
      : { data: [], error: null },
    externalIds.length
      ? supabase.from("external_reviews").select(`course_code, ${RMP_REVIEW_COLUMNS}`).in("id", externalIds)
      : { data: [], error: null },
  ]);

  if (reviewError || externalError) {
    return NextResponse.json({ error: (reviewError ?? externalError)!.message }, { status: 500 });
  }

  return NextResponse.json({ reviews, externalReviews }, { status: 200 });
}
