import { createClient } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { StarRating } from "@/components/star-rating";
import Link from "next/link";
import { redirect } from "next/navigation";

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default async function MyReviews() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/auth/login")
  }

  const user = await currentUser()
  
  // Check if email is verified (Clerk handles this)
  if (user && user.emailAddresses[0]?.verification?.status !== "verified") {
    redirect("/auth/login?error=Please verify your email address before accessing this page.")
  }

  const supabase = await createClient();

  // Fetch reviews posted by this user
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <main className="flex justify-center">
      <section className="w-full sm:w-10/12 sm:m-8 m-2">
        {error && <p className="text-red-500">Error loading reviews: {error.message}</p>}

        {!reviews || reviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">You haven&apos;t posted any reviews yet.</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 border rounded-xl dark:bg-gray-800 dark:text-white">
                <div className="flex flex-col md:flex-row md:space-x-4 flex-1">
                  <div className="flex flex-col space-y-1 mr-4">
                    <div>
                      <p className="text-sm text-gray-400">Rating</p>
                      <StarRating rating={r.rating} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Difficulty</p>
                      <StarRating rating={r.difficulty} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Workload</p>
                      <StarRating rating={r.workload} />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <p>
                      <Link
                        href={`/${r.course_code}#reviews`}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {r.course_code}
                      </Link>{" "}
                      taught by <b>{r.instructor}</b>
                    </p>
                    <p>{r.review_text}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-s dark:text-white text-black font-bold">
                        {`${new Date(r.created_at).toLocaleString("en-US", { month: "short" })} ${getOrdinal(new Date(r.created_at).getDate())}, ${new Date(r.created_at).getFullYear()}`}
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
