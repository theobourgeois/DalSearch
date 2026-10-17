import { revalidatePath } from "next/cache";
import { clearCatalog } from "@/lib/data";

/**
 * Called by the data refresh workflow once new data is in Supabase, so pages show it straight away
 * instead of within a day. Needs `Authorization: Bearer <REVALIDATE_SECRET>`.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  clearCatalog();
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true });
}
