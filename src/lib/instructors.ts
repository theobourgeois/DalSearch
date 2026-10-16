import type { RateMyProfInstructorData } from "./types";

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

export function summarizeRating(name: string, rmp: RateMyProfInstructorData | null | undefined): RatingSummary {
    const rating = Number(rmp?.overallRating);
    const rated = rating > 0;
    return {
        name,
        displayName: rmp ? `${rmp.firstName} ${rmp.lastName}` : name,
        rating: rated ? rating : null,
        takeAgain: rated && rmp?.takeAgainRating && rmp.takeAgainRating !== "N/A" ? rmp.takeAgainRating : null,
        difficulty: rated ? Number(rmp?.difficultyLevel) : null,
        ratingCount: rated ? Number(rmp?.numberOfRatings ?? 0) : 0,
        profileUrl: rmp?.rateMyProfLink ?? null,
    };
}

/** "57 ratings", "Only 6 ratings", "No ratings yet". */
export function describeRatingCount(count: number): string {
    if (count === 0) return "No ratings yet";
    const label = `${count} ${count === 1 ? "rating" : "ratings"}`;
    return count < FEW_RATINGS ? `Only ${label}` : label;
}
