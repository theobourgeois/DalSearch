"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client"
import { StarInput } from "@/components/star-input";

export default function ReviewForm({ courseId }: { courseId: string }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [workload, setWorkload] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const wordLimit = 250;

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

    if (wordCount > wordLimit) {
      setMessage(`Review cannot exceed ${wordLimit} words.`);
      setLoading(false);
      return;
    }

    if (!rating || !difficulty || !workload) {
      setMessage("Please provide all ratings (overall, difficulty, workload).");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      course_code: courseId,
      review_text: text,
      user_id: user.id,
      rating,
      difficulty,
      workload,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Review posted!");
      setText("");
      setRating(0);
      setDifficulty(0);
      setWorkload(0);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your review..."
        className="w-full p-2 border rounded-xl text-gray-700 dark:bg-gray-800 dark:text-gray-300 h-48 resize-none"
      />

      <p className={`text-xs text-right ${wordCount > wordLimit ? "text-red-500" : "text-gray-500"}`}>
        {wordCount}/{wordLimit} words
      </p>

      <div className="flex flex-col sm:flex-row sm:space-x-4 sm:space-y-0 space-y-4">
        <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating</label>
        <StarInput value={rating} onChange={setRating} />
        </div>

        <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
        <StarInput value={difficulty} onChange={setDifficulty} />
        </div>

        <div className="flex items-center space-x-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Workload</label>
        <StarInput value={workload} onChange={setWorkload} />
        </div>
      </div>

      <div className="flex justify-center">
        <button
                type="submit"
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-500 dark:hover:bg-yellow-300 dark:bg-yellow-400 text-black px-4 py-2 rounded-xl w-1/2 mt-4"
              >
                {loading ? "Posting..." : "Submit Review"}
        </button>
      </div>
      
      {message && <p className="text-sm text-center text-red-500">{message}</p>}
    </form>
  );
}
