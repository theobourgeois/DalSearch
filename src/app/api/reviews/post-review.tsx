"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import { StarInput } from "@/components/star-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components//ui/select";

export default function ReviewForm({ courseId, instructors }: { courseId: string, instructors: string[] }) {
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [workload, setWorkload] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState(instructors[0] || "");
  const [newInstructor, setNewInstructor] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useUser();

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const wordLimit = 250;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!user) {
      setMessage("You must be signed in to post a review.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

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

    const instructorToSave = selectedInstructor === "Other" ? newInstructor.trim() : selectedInstructor;

    if (!instructorToSave) {
      setMessage("Please enter a professor name.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      course_code: courseId,
      instructor: instructorToSave,
      review_text: text,
      user_id: user.id,
      rating,
      difficulty,
      workload,
    });

    if (error) {
      // Check if it's a duplicate key error (user already reviewed this course)
      if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
        setMessage("You have already posted a review for this course. You can only post one review per course.");
      } else {
        setMessage(error.message);
      }
    } else {
      setMessage("Review posted successfully!");
      setText("");
      setRating(0);
      setDifficulty(0);
      setWorkload(0);
      setSelectedInstructor(instructors[0] || "");
      setNewInstructor("");
      
      // Trigger refresh of review list
      window.dispatchEvent(new CustomEvent("reviewPosted", { detail: { courseId } }));
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

        <div className="flex items-center space-x-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instructor
          </label>
          
            <Select value={selectedInstructor} onValueChange={(val) => setSelectedInstructor(val)}>
              <SelectTrigger className="w-3/4">
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
      
      {message && (
        <p className={`text-sm text-center ${
          message.includes("already posted") || message.includes("error") || message.includes("Error")
            ? "text-red-500"
            : message.includes("successfully")
            ? "text-green-500"
            : "text-gray-700 dark:text-gray-300"
        }`}>
          {message}
        </p>
      )}
    </form>
  );
}
