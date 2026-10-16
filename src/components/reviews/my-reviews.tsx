import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { ReviewContent } from "@/lib/reviews";
import { formatCourseCode } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";
import { ReviewItem } from "./review-item";

/** Every review the signed-in student has posted. */
export async function MyReviews({ userId }: { userId: string }) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("reviews")
        .select("id, course_code, instructor, review_text, rating, difficulty, workload, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    const reviews = (data ?? []) as ReviewContent[];

    if (error) return <EmptyState className="mt-8" title="Couldn't load your reviews" description={error.message} />;

    if (reviews.length === 0) {
        return (
            <EmptyState
                className="mt-8"
                title="You haven't reviewed anything yet"
                description="Open a course you've taken and share how it went."
                action={
                    <Button asChild variant="outline">
                        <Link href="/explore">Find a course</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="mt-6">
            {reviews.map((review) => (
                <ReviewItem
                    key={review.id}
                    review={review}
                    context={
                        <Link href={`/${review.course_code}#reviews`} className="hover:underline">
                            {formatCourseCode(review.course_code)}
                        </Link>
                    }
                />
            ))}
        </div>
    );
}
