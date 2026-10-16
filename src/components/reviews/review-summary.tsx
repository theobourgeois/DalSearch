import { averageScores, scoreLabels, type Review, scoreKeys } from "@/lib/reviews";

/** The average overall, difficulty and workload scores, shown large. */
export function ReviewScoresSummary({ reviews }: { reviews: Review[] }) {
    const averages = averageScores(reviews);
    if (!averages) return null;

    return (
        <div className="flex flex-wrap items-baseline gap-x-9 gap-y-2">
            {scoreKeys.map((key) => (
                <span key={key} className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tight">{averages[key].toFixed(1)}</span>
                    <span className="text-sm font-medium lowercase text-fg-muted">{scoreLabels[key]}</span>
                </span>
            ))}
        </div>
    );
}
