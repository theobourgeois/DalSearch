import MyReviews from "../api/reviews/get-user-reviews";

export default async function MyReviewPage() {
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