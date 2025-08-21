"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  if (loading) return <p>Loading reviews...</p>;
  if (reviews.length === 0) return <p>No reviews yet. Be the first!</p>;

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="p-2 border rounded dark:bg-gray-800 dark:text-black">
          <p>{r.review_text}</p>
          <p className="text-xs text-gray-500">Posted on {new Date(r.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
