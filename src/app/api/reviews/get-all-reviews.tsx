"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "@/components/star-rating"
import { StarInput } from "@/components/star-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { SquarePen } from 'lucide-react';

const supabase = createClient();

interface Review {
  id: string;
  course_code: string;
  user_id: string;
  instructor: string;
  review_text: string;
  rating: number;       
  difficulty: number;   
  workload: number;
  created_at: string;
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ReviewList({ courseId, instructors }: { courseId: string, instructors: string[] }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [workload, setWorkload] = useState(0);
  const [limit, setLimit] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [newInstructor, setNewInstructor] = useState("");

  const fetchReviews = useCallback(async (fetchLimit: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const { data, error, count } = await supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("course_code", courseId)
      .order("created_at", { ascending: false })
      .limit(fetchLimit);

    if (error) {
      console.error(error);
    } else {
      if (isLoadMore) {
        // When loading more, we fetch all reviews up to the new limit
        // But we only want to append the new ones
        setReviews(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const allNewReviews = data || [];
          const newReviews = allNewReviews.filter(r => !existingIds.has(r.id));
          return [...prev, ...newReviews];
        });
      } else {
        // Replace all reviews on initial load or refresh
        setReviews(data || []);
      }
      setTotalCount(count || 0);
      setHasMore((count || 0) > fetchLimit);
    }

    if (isLoadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const { user } = useUser();
  
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  const handleUpdate = async (id: string) => {

    const instructorToSave = selectedInstructor === "Other" ? newInstructor.trim() : selectedInstructor;
    
    const { error } = await supabase
      .from("reviews")
      .update({ review_text: editText,
      rating,
      difficulty,
      workload,
      instructor: instructorToSave, })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error(error);
    } else {
      setEditingId(null);
      fetchReviews(limit, false);
    }
  };

  // Initial fetch when courseId changes
  useEffect(() => {
    setLimit(2); // Reset limit when course changes
    setReviews([]); // Clear existing reviews
    fetchReviews(2, false);
  }, [courseId, fetchReviews]);

  // Fetch more when limit increases (but not on initial mount)
  useEffect(() => {
    if (limit > 2 && reviews.length > 0) {
      fetchReviews(limit, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Listen for review posted event to refresh the list
  useEffect(() => {
    const handleReviewPosted = (event: CustomEvent) => {
      // Only refresh if it's for this course
      if (event.detail?.courseId === courseId) {
        // Reset limit and fetch all reviews to show the new one
        setLimit(2);
        fetchReviews(2, false);
      }
    };

    window.addEventListener("reviewPosted", handleReviewPosted as EventListener);
    
    return () => {
      window.removeEventListener("reviewPosted", handleReviewPosted as EventListener);
    };
  }, [courseId, fetchReviews]);

  if (loading) return <p>Loading reviews...</p>;
  if (reviews.length === 0) return <p>No reviews yet. Be the first!</p>;

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {reviews.map((r) => (
        <div key={r.id} className="p-2 border rounded-xl w-5/6 dark:bg-gray-800 dark:text-black">
          {editingId === r.id ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-1 border rounded-xl resize-none h-48 dark:bg-gray-900 dark:text-gray-300"
              />

              <div className="flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-2 mt-2 mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Overall Rating</label>
                  <StarInput value={rating} onChange={setRating} />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Difficulty</label>
                  <StarInput value={difficulty} onChange={setDifficulty} />
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">Workload</label>
                  <StarInput value={workload} onChange={setWorkload} />
                </div>
            </div>

            {instructors.length > 0 && (
            <div className="flex items-center space-x-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instructor
            </label>
          
            <Select value={selectedInstructor} onValueChange={(val) => setSelectedInstructor(val)}>
              <SelectTrigger className="w-1/3 dark:text-white">
                <SelectValue placeholder="Select an instructor" />
             </SelectTrigger>
              <SelectContent>
                {instructors.map((inst) => (
                  <SelectItem key={inst} value={inst}>
                    {inst}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              {selectedInstructor === "Other" && (
                <input
                  type="text"
                  placeholder="Enter professor name"
                  value={newInstructor}
                  onChange={(e) => setNewInstructor(e.target.value)}
                  className="w-full p-2 border rounded-xl dark:bg-gray-800 dark:text-gray-300"
                />
              )}
            </div>
          </div>
        )}
          
              <button
                onClick={() => handleUpdate(r.id)}
                className="px-2 py-1 bg-yellow-400 text-black rounded-xl mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-2 py-1 bg-gray-900 text-white border border-white rounded-xl"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
            <div className="flex flex-col md:flex-row md:space-x-4 flex-1">
              <div className="flex flex-col space-y-1 mr-4">
                <div>
                  <p className="text-s text-gray-400">Rating</p>
                  <StarRating rating={r.rating} />
                </div>
                <div>
                  <p className="text-s text-gray-400">Difficulty</p>
                  <StarRating rating={r.difficulty} />
                </div>
                <div>
                  <p className="text-s text-gray-400">Workload</p>
                  <StarRating rating={r.workload} />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
              <p className="dark:text-white"><b>{r.course_code}</b> taught by <b>{r.instructor}</b></p>
              <p className="dark:text-white">{r.review_text}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex flex-row items-end gap-1">
              {r.user_id === userId && (
                <div className="flex space-x-2 mt-1">
                <button
                  onClick={() => {
                    setEditingId(r.id);
                    setEditText(r.review_text);
                    setRating(r.rating);
                    setDifficulty(r.difficulty);
                    setWorkload(r.workload);
                    if (instructors.includes(r.instructor)) {
                      setSelectedInstructor(r.instructor);
                      setNewInstructor("");
                    } else {
                      setSelectedInstructor("Other");
                      setNewInstructor(r.instructor);
                    }
                  }}
                  className="text-gray-800 dark:text-white"
                >
                  <SquarePen className="w-6 h-6 hover:text-yellow-400" />
                </button>
              </div>)}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/flags/add", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ review_id: r.id }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      alert("Failed to flag review: " + data.error);
                      return;
                    }
                    alert("Review flagged successfully!");
                  } catch (err) {
                    console.error(err);
                    alert("Something went wrong.");
                  }
                }}
                className="dark:text-gray-100 text-gray-900 text-sm flex items-center gap-1"
              >
                <Flag className="w-6 h-6 hover:text-red-600" />
              </button>
              </div>
              <p className="text-s dark:text-white text-black font-bold">
                {`${new Date(r.created_at).toLocaleString("en-US", { month: "short" })} ${getOrdinal(new Date(r.created_at).getDate())}, ${new Date(r.created_at).getFullYear()}`}
              </p>
              </div>
            </>
          )}
        </div>
      ))}
        {hasMore && (
          <button
            onClick={() => setLimit(limit + 3)}
            disabled={loadingMore}
            className="px-4 py-2 mt-4 dark:hover:bg-yellow-300 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : `Load more (${reviews.length} of ${totalCount})`}
          </button>
        )}
    </div>
  );
}
