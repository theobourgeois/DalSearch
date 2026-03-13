"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "@/components/star-rating"
import { StarInput } from "@/components/star-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flag, SquarePen, UserCircle2 } from "lucide-react";

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
  const [limit, setLimit] = useState(5);
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
    setLimit(5); // Reset limit when course changes
    setReviews([]); // Clear existing reviews
    fetchReviews(5, false);
  }, [courseId, fetchReviews]);

  // Fetch more when limit increases (but not on initial mount)
  useEffect(() => {
    if (limit > 5 && reviews.length > 0) {
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
        setLimit(5);
        fetchReviews(5, false);
      }
    };

    window.addEventListener("reviewPosted", handleReviewPosted as EventListener);
    
    return () => {
      window.removeEventListener("reviewPosted", handleReviewPosted as EventListener);
    };
  }, [courseId, fetchReviews]);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>;
  if (reviews.length === 0) return <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first!</p>;

  return (
    <div className="flex flex-col space-y-4 w-full mt-8">
      <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2 mb-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Student Reviews <span className="text-gray-500 text-sm font-normal">({totalCount})</span>
        </h3>
      </div>
      
      {reviews.map((r) => (
        <div key={r.id} className="p-5 border rounded-xl bg-white dark:bg-gray-700/20 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
          {editingId === r.id ? (
            <div className="space-y-4">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[120px] bg-white dark:bg-gray-900 dark:border-gray-600 focus-visible:ring-yellow-400"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Overall Rating</Label>
                  <StarInput value={rating} onChange={setRating} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Difficulty</Label>
                  <StarInput value={difficulty} onChange={setDifficulty} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-medium">Workload</Label>
                  <StarInput value={workload} onChange={setWorkload} />
                </div>

                {instructors.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-medium">Instructor</Label>
                    <Select value={selectedInstructor} onValueChange={(val) => setSelectedInstructor(val)}>
                      <SelectTrigger className="w-full bg-white dark:bg-gray-900 dark:border-gray-600">
                        <SelectValue placeholder="Select instructor" />
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

                    {selectedInstructor === "Other" && (
                      <Input
                        type="text"
                        placeholder="Enter professor name"
                        value={newInstructor}
                        onChange={(e) => setNewInstructor(e.target.value)}
                        className="mt-2 bg-white dark:bg-gray-900 dark:border-gray-600 focus-visible:ring-yellow-400"
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdate(r.id)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold dark:bg-yellow-500 dark:hover:bg-yellow-400"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full border dark:border-gray-700">
                    <UserCircle2 className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Taught by <span className="font-semibold">{r.instructor}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {`${new Date(r.created_at).toLocaleString("en-US", { month: "short" })} ${getOrdinal(new Date(r.created_at).getDate())}, ${new Date(r.created_at).getFullYear()}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {r.user_id === userId && (
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
                      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit review"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to flag this review for moderation?")) {
                        try {
                          const res = await fetch("/api/flags/add", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ review_id: r.id }),
                          });
                          if (!res.ok) {
                            const data = await res.json();
                            alert("Failed to flag review: " + data.error);
                            return;
                          }
                          alert("Review flagged successfully. Thank you for helping keep the community safe!");
                        } catch (err) {
                          console.error(err);
                          alert("Something went wrong.");
                        }
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Flag review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/40 rounded-lg px-2">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Overall</span>
                  <StarRating rating={r.rating} />
                </div>
                <div className="flex flex-col items-center justify-center space-y-1 border-x border-gray-200 dark:border-gray-700/50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Difficulty</span>
                  <StarRating rating={r.difficulty} />
                </div>
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Workload</span>
                  <StarRating rating={r.workload} />
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed pt-1">
                {r.review_text}
              </p>
            </div>
          )}
        </div>
      ))}
      
      {hasMore && (
        <div className="flex justify-center pt-4 pb-2">
          <Button
            variant="outline"
            onClick={() => setLimit(limit + 5)}
            disabled={loadingMore}
            className="w-full sm:w-auto"
          >
            {loadingMore ? "Loading..." : `Load more reviews`}
          </Button>
        </div>
      )}
    </div>
  );
}
