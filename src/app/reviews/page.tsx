import { StarRating } from "@/components/star-rating"
import { createClient } from "@/lib/supabase/server"
import MyReviews from "../api/reviews/get-user-reviews";

export default async function MyReviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <main className="flex justify-center">
        <section className="w-full sm:w-10/12 sm:m-8 m-2">
            <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">
                My Reviews
            </h2>
            <MyReviews/>
        </section>
    </main>
  
  )
}