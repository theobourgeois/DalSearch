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
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50/50 dark:bg-gray-700/20 p-6 rounded-xl border dark:border-gray-700 shadow-sm">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you think of the course? Consider the teaching style, assignments, and exams..."
          className="min-h-[120px] resize-y bg-white dark:bg-gray-900 dark:border-gray-600 focus-visible:ring-yellow-400"
        />
        <div className="flex justify-between items-center text-xs">
          <p className={`${wordCount > wordLimit ? "text-red-500 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
            {wordCount}/{wordLimit} words
          </p>
          {!user && (
            <p className="text-amber-600 dark:text-amber-500 font-medium">
              Sign in to post a review
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Rating</Label>
          <StarInput value={rating} onChange={setRating} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Difficulty</Label>
          <StarInput value={difficulty} onChange={setDifficulty} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Workload</Label>
          <StarInput value={workload} onChange={setWorkload} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructor</Label>
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
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t dark:border-gray-700">
        <p className={`text-sm ${
          message.includes("already posted") || message.includes("error") || message.includes("Error")
            ? "text-red-500 font-medium"
            : message.includes("successfully")
            ? "text-green-600 dark:text-green-500 font-medium"
            : "text-gray-600 dark:text-gray-400"
        }`}>
          {message}
        </p>
        <Button
          type="submit"
          disabled={loading || !user}
          className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-black dark:bg-yellow-500 dark:hover:bg-yellow-400 font-semibold"
        >
          {loading ? "Posting..." : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
