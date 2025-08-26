"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"
import { StarRating } from "@/components/star-rating"
import { StarInput } from "@/components/star-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

export default function ReviewList({ courseId, instructors, userOnly = false}: { courseId: string, instructors: string[], userOnly?: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [workload, setWorkload] = useState(0);
  const [limit, setLimit] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [newInstructor, setNewInstructor] = useState("");

  
  const supabase = createClient();

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("course_code", courseId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) console.error(error);
    else {
    setReviews(data || []);
    setHasMore((count || 0) > (data?.length || 0));
  }

    setLoading(false);
  };

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

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
      fetchReviews();
    }
  };

  useEffect(() => {
    fetchReviews();
    getUser();
  }, [courseId, limit]);

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
              <p className="text-s dark:text-white text-black font-bold">
                {`${new Date(r.created_at).toLocaleString("en-US", { month: "short" })} ${getOrdinal(new Date(r.created_at).getDate())}, ${new Date(r.created_at).getFullYear()}`}
              </p>
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
                  className="dark:text-yellow-400 text-black text-sm mt-1"
                >
                  Edit
                </button>
              )}
              </div>
            </>
          )}
        </div>
      ))}
        {hasMore && (
          <button
            onClick={() => setLimit(limit + 3)}
            className="px-4 py-2 mt-4 dark:hover:bg-yellow-300 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl"
          >
            Load more
          </button>
        )}
    </div>
  );
}
