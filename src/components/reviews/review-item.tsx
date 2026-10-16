import { LogoMark } from "@/components/layout/logo";
import { formatReviewDate, scoreLabels, type ReviewContent, scoreKeys } from "@/lib/reviews";

type ReviewItemProps = {
    review: ReviewContent;
    /** Shown before the date, e.g. a course code link on the "My reviews" page. */
    context?: React.ReactNode;
    actions?: React.ReactNode;
};

/** One anonymous review: who taught it, when, the text and the three scores. */
export function ReviewItem({ review, context, actions }: ReviewItemProps) {
    return (
        <article className="grid grid-cols-[2.25rem_1fr] gap-3.5 border-b border-line py-5 last:border-b-0">
            <span className="grid size-9 place-items-center rounded-full bg-raised" aria-hidden>
                <LogoMark className="size-[18px] [&_path:first-child]:fill-fg-subtle" />
            </span>
            <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-[15px] font-bold">{context ?? "Anonymous"}</span>
                    <span className="text-[13px] text-fg-subtle">
                        {formatReviewDate(review.created_at)}, with {review.instructor}
                    </span>
                    {actions && <span className="ml-auto flex items-center gap-1">{actions}</span>}
                </div>
                <p className="mt-1.5 max-w-[42rem] whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-fg-body">
                    {review.review_text}
                </p>
                <div className="mt-2.5 flex gap-4 text-[13px] text-fg-subtle">
                    {scoreKeys.map((key) => (
                        <span key={key}>
                            {scoreLabels[key]} <b className="font-bold text-fg-muted">{review[key]}</b>
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
}
