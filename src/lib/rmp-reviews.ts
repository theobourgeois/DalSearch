/** A RateMyProfessors review of a course, from the external_reviews table. */
export type RmpReview = {
    id: string;
    instructor: string;
    instructor_url: string | null;
    review_text: string | null;
    /** 1-5, and it rates the professor rather than the course. */
    quality: number | null;
    difficulty: number | null;
    would_take_again: boolean | null;
    grade: string | null;
    tags: string[];
    online: boolean | null;
    reviewed_at: string;
};

export const RMP_REVIEW_COLUMNS =
    "id, instructor, instructor_url, review_text, quality, difficulty, would_take_again, grade, tags, online, reviewed_at";

/** Below this many answers, "would take again" isn't shown as a percentage. */
const MIN_TAKE_AGAIN_ANSWERS = 5;

export type RmpAverages = { quality: number | null; difficulty: number | null; takeAgain: number | null };

export function rmpAverages(reviews: RmpReview[]): RmpAverages {
    const average = (values: (number | null)[]) => {
        const scores = values.filter((value): value is number => value !== null);
        return scores.length ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10 : null;
    };
    const answers = reviews.filter((review) => review.would_take_again !== null);
    return {
        quality: average(reviews.map((review) => review.quality)),
        difficulty: average(reviews.map((review) => review.difficulty)),
        takeAgain:
            answers.length >= MIN_TAKE_AGAIN_ANSWERS
                ? Math.round((answers.filter((review) => review.would_take_again).length / answers.length) * 100)
                : null,
    };
}
