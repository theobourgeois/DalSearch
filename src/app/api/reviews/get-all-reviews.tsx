"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"

interface Review {
  id: string;
  course_code: string;
  user_id: string;
  review_text: string;
  created_at: string;
}

export default function ReviewList({ courseId }: { courseId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("course_code", courseId)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setReviews(data || []);

    setLoading(false);
  };

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from("reviews")
      .update({ review_text: editText })
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
  }, [courseId]);

  if (loading) return <p>Loading reviews...</p>;
  if (reviews.length === 0) return <p>No reviews yet. Be the first!</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="p-2 border rounded dark:bg-gray-800 dark:text-black">
          {editingId === r.id ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-1 border rounded"
              />
              <button
                onClick={() => handleUpdate(r.id)}
                className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="px-2 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="text-white">{r.review_text}</p>
              <p className="text-xs text-white">
                Posted on {new Date(r.created_at).toLocaleString()}
              </p>
              {r.user_id === userId && (
                <button
                  onClick={() => {
                    setEditingId(r.id);
                    setEditText(r.review_text);
                  }}
                  className="text-blue-500 text-sm mt-1"
                >
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
