import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { review_id } = await req.json();

  if (!review_id) {
    return NextResponse.json({ error: "review_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("flags")
    .insert({ 
      review_id,
      user_id: userId 
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Review flagged" }, { status: 200 });
}
