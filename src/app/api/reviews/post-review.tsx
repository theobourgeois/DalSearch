"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client"

export default function ReviewForm({ courseId }: { courseId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("You must be signed in to post a review.");
      setLoading(false);
      return;
    }

    if (!text.trim()) {
      setMessage("Review cannot be empty.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      course_code: courseId,
      review_text: text,
      user_id: user.id,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Review posted!");
      setText("");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your review..."
        className="w-full p-2 border rounded dark:bg-gray-800 dark:text-black"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-yellow-400 hover:bg-yellow-500 dark:hover:bg-yellow-300 text-black px-4 py-2 rounded w-full"
      >
        {loading ? "Posting..." : "Submit Review"}
      </button>
      {message && <p className="text-sm text-center text-red-500">{message}</p>}
    </form>
  );
}
