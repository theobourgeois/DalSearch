import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: flagged, error: flagError } = await supabase
    .from("flags")
    .select("review_id");

  if (flagError) {
    return NextResponse.json({ error: flagError.message }, { status: 500 });
  }

  if (!flagged || flagged.length === 0) {
    return NextResponse.json({ reviews: [] }, { status: 200 });
  }

  const reviewIds = flagged.map((f) => f.review_id);

  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select("id, course_code, instructor, review_text, rating, difficulty, workload, created_at")
    .in("id", reviewIds);

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  return NextResponse.json({ reviews }, { status: 200 });
}
