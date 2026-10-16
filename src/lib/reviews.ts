export type Review = {
    id: string;
    course_code: string;
    user_id: string;
    instructor: string;
    review_text: string;
    rating: number;
    difficulty: number;
    workload: number;
    created_at: string;
};

export type ReviewScores = Pick<Review, "rating" | "difficulty" | "workload">;

/** What's shown for a review, without who posted it. */
export type ReviewContent = ReviewScores &
    Pick<Review, "id" | "course_code" | "instructor" | "review_text" | "created_at">;

export const scoreLabels: Record<keyof ReviewScores, string> = {
    rating: "Overall",
    difficulty: "Difficulty",
    workload: "Workload",
};

export const scoreKeys = Object.keys(scoreLabels) as (keyof ReviewScores)[];

export const REVIEW_WORD_LIMIT = 250;

export function averageScores(reviews: ReviewScores[]): ReviewScores | null {
    if (reviews.length === 0) return null;
    const average = (key: keyof ReviewScores) =>
        Math.round((reviews.reduce((total, review) => total + review[key], 0) / reviews.length) * 10) / 10;
    return { rating: average("rating"), difficulty: average("difficulty"), workload: average("workload") };
}

/** "Mar 2025" */
export function formatReviewDate(date: string): string {
    return new Date(date).toLocaleDateString("en-CA", { month: "short", year: "numeric" });
}

export function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
