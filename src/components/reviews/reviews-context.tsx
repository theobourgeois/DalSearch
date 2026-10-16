"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Review } from "@/lib/reviews";
import { createClient, hasSupabase } from "@/lib/supabase/client";

type ReviewsState = {
    courseId: string;
    instructors: string[];
    reviews: Review[];
    status: "loading" | "ready" | "unavailable";
    refresh: () => Promise<void>;
};

const ReviewsContext = createContext<ReviewsState | null>(null);

/** Loads a course's reviews once and shares them between the overview summary and the Reviews tab. */
export function ReviewsProvider({
    courseId,
    instructors,
    children,
}: {
    courseId: string;
    instructors: string[];
    children: React.ReactNode;
}) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [status, setStatus] = useState<ReviewsState["status"]>(hasSupabase ? "loading" : "unavailable");

    const refresh = useCallback(async () => {
        if (!hasSupabase) return;
        const { data, error } = await createClient()
            .from("reviews")
            .select("*")
            .eq("course_code", courseId)
            .order("created_at", { ascending: false });
        setReviews(error ? [] : (data as Review[]));
        setStatus(error ? "unavailable" : "ready");
    }, [courseId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({ courseId, instructors, reviews, status, refresh }),
        [courseId, instructors, reviews, status, refresh],
    );
    return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews(): ReviewsState {
    const context = useContext(ReviewsContext);
    if (!context) throw new Error("useReviews must be used inside ReviewsProvider");
    return context;
}
