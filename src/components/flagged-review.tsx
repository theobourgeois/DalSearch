"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StarRating } from "@/components/star-rating";

interface FlaggedReview {
  flag_id: string;
  id: string;
  reason: string;
  created_at: string;
  course_code: string;
  instructor: string;
  review_text: string;
  rating: number;
  difficulty: number;
  workload: number;
}

function getOrdinal(day: number) {
  if (day > 3 && day < 21) return day + "th";
  switch (day % 10) {
    case 1: return day + "st";
    case 2: return day + "nd";
    case 3: return day + "rd";
    default: return day + "th";
  }
}

export default function FlaggedReviewsPage() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    fetch("/api/flags/list")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []))
      .catch((err) => setError(err));
  }, []);

  return (
    <main className="flex justify-center">
      <section className="w-full sm:w-10/12 sm:m-8 m-2">
        {error && <p className="text-red-500">Error loading reviews: {error}</p>}

        {!reviews || reviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            No flagged reviews at the moment.
          </p>
        ) : (
          <div className="flex flex-col space-y-4">
            {reviews.map((r) => (
              <div
                key={r.flag_id}
                className="p-4 border rounded-xl dark:bg-gray-800 dark:text-white"
              >
                <div className="flex flex-col md:flex-row md:space-x-4 flex-1">
                  {/* Ratings */}
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

                  {/* Review content */}
                  <div className="flex flex-col space-y-2 flex-1">
                    <p>
                      <Link
                        href={`/courses/${r.course_code}`}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {r.course_code}
                      </Link>{" "}
                      taught by <b>{r.instructor}</b>
                    </p>
                    <p>{r.review_text}</p>

                    {/* Flag reason */}
                    <p className="text-red-500 font-semibold">
                      🚩 Flagged Reason: {r.id}
                    </p>
                  </div>
                </div>

                {/* Date & delete action */}
                <div className="flex flex-col items-end mt-2">
                  <p className="text-sm dark:text-white text-black font-bold">
                    {`${new Date(r.created_at).toLocaleString("en-US", {
                      month: "short",
                    })} ${getOrdinal(
                      new Date(r.created_at).getDate()
                    )}, ${new Date(r.created_at).getFullYear()}`}
                  </p>
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this review?")) return;
                      const res = await fetch("/api/reviews/delete-review", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ review_id: r.id }),
                      });
                      if (res.ok) {
                        setReviews((prev) =>
                          prev.filter((rev) => rev.id !== r.id)
                        );
                      }
                    }}
                    className="mt-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete Review
                  </button>

                  <button
                  onClick={async () => {
                    if (!confirm("Ignore all flags for this review?")) return;
                    const res = await fetch("/api/flags/ignore", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ review_id: r.id }),
                    });
                    if (res.ok) {
                      setReviews((prev) => prev.filter((rev) => rev.id !== r.id));
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                >
                  Ignore Flags
                </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}