"use client";

import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { formatReviewDate } from "@/lib/reviews";
import { useCourse } from "./course-context";
import { ReviewScoresSummary } from "@/components/reviews/review-summary";
import { useReviews } from "@/components/reviews/reviews-context";

/** "What students say" on the Overview tab: average scores and the latest review. */
export function ReviewsSummary() {
    const { reviews, status } = useReviews();
    const { setTab } = useCourse();
    if (status !== "ready") return null;

    const [latest] = reviews;
    return (
        <section className="mt-11">
            <SectionHeader title="What students say">
                <Button variant="link" className="font-bold" onClick={() => setTab("reviews")}>
                    {reviews.length > 0 ? `All ${reviews.length} reviews` : "Write the first review"}
                </Button>
            </SectionHeader>
            {latest ? (
                <>
                    <div className="mt-4">
                        <ReviewScoresSummary reviews={reviews} />
                    </div>
                    <figure className="mt-5 max-w-[42rem] rounded-card bg-raised px-6 py-5">
                        <blockquote className="line-clamp-4 text-[15px] font-medium leading-relaxed text-fg-body">
                            {latest.review_text}
                        </blockquote>
                        <figcaption className="mt-2 text-[13px] text-fg-subtle">
                            Latest review, {formatReviewDate(latest.created_at)} with {latest.instructor}
                        </figcaption>
                    </figure>
                </>
            ) : (
                <p className="mt-3 text-sm font-medium text-fg-muted">Nobody has reviewed this course yet.</p>
            )}
        </section>
    );
}
