"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EyeSlashIcon, ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/layout/page";
import { ReviewItem } from "@/components/reviews/review-item";
import { hideRmpReview, RmpReviewItem } from "@/components/reviews/rmp-reviews";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ReviewContent } from "@/lib/reviews";
import type { RmpReview } from "@/lib/rmp-reviews";
import { formatCourseCode } from "@/lib/schedule";
import { universityPath } from "@/lib/university";

type ReportedRmpReview = RmpReview & { university_id: string; course_code: string };

async function post(url: string, body: Record<string, string>) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return response.ok;
}

const CourseLink = ({ university, code }: { university: string; code: string }) => (
    <Link href={universityPath(university, `/${code}#reviews`)} className="hover:underline">
        {formatCourseCode(code)}
    </Link>
);

/**
 * Reviews students have flagged, with actions to dismiss the flags or delete the review, and reported
 * RateMyProfessors reviews, which can be dismissed or hidden.
 */
export function FlaggedReviews() {
    const [reviews, setReviews] = useState<ReviewContent[] | null>(null);
    const [rmpReviews, setRmpReviews] = useState<ReportedRmpReview[]>([]);

    useEffect(() => {
        fetch("/api/flags/list")
            .then((response) => response.json())
            .then((data: { reviews?: ReviewContent[]; externalReviews?: ReportedRmpReview[] }) => {
                setReviews(data.reviews ?? []);
                setRmpReviews(data.externalReviews ?? []);
            })
            .catch(() => setReviews([]));
    }, []);

    const removeRmp = (review: RmpReview) => setRmpReviews((current) => current.filter((item) => item.id !== review.id));

    const dismissRmp = async (review: RmpReview) => {
        if (!window.confirm("Dismiss every report on this review?")) return;
        const ok = await post("/api/flags/ignore", { external_review_id: review.id });
        if (ok) removeRmp(review);
        toast(ok ? "Reports dismissed" : "Something went wrong. Try again.");
    };

    const resolve = async (review: ReviewContent, action: "ignore" | "delete") => {
        const question = action === "ignore" ? "Dismiss every flag on this review?" : "Delete this review for good?";
        if (!window.confirm(question)) return;
        const ok = await post(action === "ignore" ? "/api/flags/ignore" : "/api/reviews/delete-review", {
            review_id: review.id,
        });
        if (ok) setReviews((current) => current?.filter((item) => item.id !== review.id) ?? null);
        toast(ok ? (action === "ignore" ? "Flags dismissed" : "Review deleted") : "Something went wrong. Try again.");
    };

    return (
        <section className="mt-10">
            <SectionHeader title="Flagged reviews" />
            {reviews?.length === 0 && rmpReviews.length === 0 && (
                <EmptyState className="mt-4" title="Nothing flagged right now" />
            )}
            <div className="mt-2">
                {reviews?.map((review) => (
                    <ReviewItem
                        key={review.id}
                        review={review}
                        context={<CourseLink university={review.university_id} code={review.course_code} />}
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
            {rmpReviews.length > 0 && (
                <>
                    <h3 className="mb-1 mt-8 text-[13px] font-bold text-fg-subtle">Reported from RateMyProfessors</h3>
                    {rmpReviews.map((review) => (
                        <RmpReviewItem
                            key={review.id}
                            review={review}
                            context={<CourseLink university={review.university_id} code={review.course_code} />}
                            actions={
                                <>
                                    <SimpleTooltip label="Dismiss reports">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Dismiss reports"
                                            onClick={() => dismissRmp(review)}
                                        >
                                            <ShieldCheckIcon />
                                        </Button>
                                    </SimpleTooltip>
                                    <SimpleTooltip label="Hide on DalSearch">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Hide review"
                                            onClick={async () => (await hideRmpReview(review)) && removeRmp(review)}
                                        >
                                            <EyeSlashIcon />
                                        </Button>
                                    </SimpleTooltip>
                                </>
                            }
                        />
                    ))}
                </>
            )}
        </section>
    );
}
