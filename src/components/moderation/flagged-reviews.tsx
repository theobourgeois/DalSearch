"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/layout/page";
import { ReviewItem } from "@/components/reviews/review-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ReviewContent } from "@/lib/reviews";
import { formatCourseCode } from "@/lib/schedule";

async function post(url: string, reviewId: string) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: reviewId }),
    });
    return response.ok;
}

/** Reviews students have flagged, with actions to dismiss the flags or delete the review. */
export function FlaggedReviews() {
    const [reviews, setReviews] = useState<ReviewContent[] | null>(null);

    useEffect(() => {
        fetch("/api/flags/list")
            .then((response) => response.json())
            .then((data: { reviews?: ReviewContent[] }) => setReviews(data.reviews ?? []))
            .catch(() => setReviews([]));
    }, []);

    const resolve = async (review: ReviewContent, action: "ignore" | "delete") => {
        const question = action === "ignore" ? "Dismiss every flag on this review?" : "Delete this review for good?";
        if (!window.confirm(question)) return;
        const ok = await post(action === "ignore" ? "/api/flags/ignore" : "/api/reviews/delete-review", review.id);
        if (ok) setReviews((current) => current?.filter((item) => item.id !== review.id) ?? null);
        toast(ok ? (action === "ignore" ? "Flags dismissed" : "Review deleted") : "Something went wrong. Try again.");
    };

    return (
        <section className="mt-10">
            <SectionHeader title="Flagged reviews" />
            {reviews?.length === 0 && <EmptyState className="mt-4" title="Nothing flagged right now" />}
            <div className="mt-2">
                {reviews?.map((review) => (
                    <ReviewItem
                        key={review.id}
                        review={review}
                        context={
                            <Link href={`/${review.course_code}#reviews`} className="hover:underline">
                                {formatCourseCode(review.course_code)}
                            </Link>
                        }
                        actions={
                            <>
                                <SimpleTooltip label="Dismiss flags">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Dismiss flags"
                                        onClick={() => resolve(review, "ignore")}
                                    >
                                        <ShieldCheckIcon />
                                    </Button>
                                </SimpleTooltip>
                                <SimpleTooltip label="Delete review">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Delete review"
                                        onClick={() => resolve(review, "delete")}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </SimpleTooltip>
                            </>
                        }
                    />
                ))}
            </div>
        </section>
    );
}
