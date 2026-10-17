import type { InstructorRating } from "./types";

/** Below this many ratings, a score is flagged as based on few ratings. */
export const FEW_RATINGS = 10;

/** "Kalyaniwalla N. " -> "Kalyaniwalla N.", "Dey S. (P)" -> "Dey S.", "Staff" -> null. */
export function cleanInstructorName(raw: string): string | null {
    const name = raw.replace(/\s*\(P\)\s*$/, "").trim();
    return name && name !== "Staff" ? name : null;
}

/** An instructor's RateMyProfessors numbers, ready to display. */
export type RatingSummary = {
    name: string;
    displayName: string;
    rating: number | null;
    takeAgain: string | null;
    difficulty: number | null;
    ratingCount: number;
    profileUrl: string | null;
};

export function summarizeRating(name: string, rmp: InstructorRating | null | undefined): RatingSummary {
    const rated = rmp?.rating != null && rmp.rating > 0;
    return {
        name,
        displayName: rmp ? `${rmp.firstName} ${rmp.lastName}`.trim() || name : name,
        rating: rated ? rmp.rating : null,
        takeAgain: rated && rmp.wouldTakeAgain !== null ? `${Math.round(rmp.wouldTakeAgain)}%` : null,
        difficulty: rated ? rmp.difficulty : null,
        ratingCount: rated ? rmp.ratingCount : 0,
        profileUrl: rmp?.profileUrl ?? null,
    };
}

/** "57 ratings", "Only 6 ratings", "No ratings yet". */
export function describeRatingCount(count: number): string {
    if (count === 0) return "No ratings yet";
    const label = `${count} ${count === 1 ? "rating" : "ratings"}`;
    return count < FEW_RATINGS ? `Only ${label}` : label;
}
