"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_WORD_LIMIT, scoreLabels, wordCount, type Review, type ReviewScores, scoreKeys } from "@/lib/reviews";
import { cn } from "@/lib/utils";
import { StarInput } from "./star-input";

const OTHER = "Other";

function validate(text: string, scores: ReviewScores, instructor: string): string | null {
    if (!text.trim()) return "Write a few words about the course.";
    if (wordCount(text) > REVIEW_WORD_LIMIT) return `Keep it under ${REVIEW_WORD_LIMIT} words.`;
    if (Object.values(scores).some((score) => score === 0)) return "Give an overall, difficulty and workload rating.";
    if (!instructor) return "Add the instructor's name.";
    return null;
}

export type ReviewDraft = Pick<Review, "review_text" | "instructor" | "rating" | "difficulty" | "workload">;

type ReviewFormProps = {
    instructors: string[];
    initial?: ReviewDraft;
    submitLabel: string;
    onSubmit: (draft: ReviewDraft) => Promise<string | null>;
    onCancel?: () => void;
};

/** The fields for writing or editing a review. `onSubmit` resolves to an error message, or null on success. */
export function ReviewForm({ instructors, initial, submitLabel, onSubmit, onCancel }: ReviewFormProps) {
    const knownInstructor = !initial || instructors.includes(initial.instructor);
    const [text, setText] = useState(initial?.review_text ?? "");
    const [scores, setScores] = useState<ReviewScores>({
        rating: initial?.rating ?? 0,
        difficulty: initial?.difficulty ?? 0,
        workload: initial?.workload ?? 0,
    });
    const [instructor, setInstructor] = useState(
        knownInstructor ? (initial?.instructor ?? instructors[0] ?? OTHER) : OTHER,
    );
    const [otherInstructor, setOtherInstructor] = useState(knownInstructor ? "" : (initial?.instructor ?? ""));
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const instructorId = useId();
    const words = wordCount(text);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const chosenInstructor = instructor === OTHER ? otherInstructor.trim() : instructor;
        const problem = validate(text, scores, chosenInstructor);
        if (problem) {
            setError(problem);
            return;
        }

        setSaving(true);
        const failure = await onSubmit({ review_text: text.trim(), instructor: chosenInstructor, ...scores });
        setSaving(false);
        setError(failure);
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            <div>
                <Textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="What was it like? Think about the teaching, assignments and exams."
                    aria-label="Review"
                />
                <p
                    className={cn(
                        "mt-1.5 px-1 text-xs font-medium",
                        words > REVIEW_WORD_LIMIT ? "text-danger" : "text-fg-subtle",
                    )}
                >
                    {words}/{REVIEW_WORD_LIMIT} words
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {scoreKeys.map((key) => (
                    <div key={key} className="flex flex-col gap-2">
                        <span className="text-[13px] font-bold text-fg-muted">{scoreLabels[key]}</span>
                        <StarInput
                            label={scoreLabels[key]}
                            value={scores[key]}
                            onChange={(value) => setScores({ ...scores, [key]: value })}
                        />
                    </div>
                ))}
                <div className="flex flex-col gap-2">
                    <Label htmlFor={instructorId}>Instructor</Label>
                    <Select value={instructor} onValueChange={setInstructor}>
                        <SelectTrigger id={instructorId} className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[...instructors, OTHER].map((name) => (
                                <SelectItem key={name} value={name}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {instructor === OTHER && (
                        <Input
                            className="h-10"
                            value={otherInstructor}
                            onChange={(event) => setOtherInstructor(event.target.value)}
                            placeholder="Instructor's name"
                            aria-label="Instructor's name"
                        />
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
                {error && <p className="mr-auto text-sm font-medium text-danger">{error}</p>}
                {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? "Saving..." : submitLabel}
                </Button>
            </div>
        </form>
    );
}
