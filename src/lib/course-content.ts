import "server-only";

import { createClient } from "@supabase/supabase-js";
import { RMP_REVIEW_COLUMNS, type RmpReview } from "./rmp-reviews";
import { SYLLABUS_COLUMNS, syllabusTermOrder, type Syllabus } from "./syllabi";
import type { CourseAndSubjectCode } from "./types";

/**
 * Reads the scraped tables that every visitor sees the same way. No cookies, so course pages stay
 * cached; the scripts that fill these tables run a few times a term at most.
 */
function publicClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
    return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** RateMyProfessors reviews that mention the course, newest first. Empty if they can't be loaded. */
export async function getRmpReviews(code: CourseAndSubjectCode): Promise<RmpReview[]> {
    const client = publicClient();
    if (!client) return [];
    const { data, error } = await client
        .from("external_reviews")
        .select(RMP_REVIEW_COLUMNS)
        .eq("source", "rmp")
        .eq("course_code", code)
        .order("reviewed_at", { ascending: false });
    return error ? [] : (data as RmpReview[]);
}

/** Public syllabi for the course, latest term first. Empty if they can't be loaded. */
export async function getSyllabi(code: CourseAndSubjectCode): Promise<Syllabus[]> {
    const client = publicClient();
    if (!client) return [];
    const { data, error } = await client.from("syllabi").select(SYLLABUS_COLUMNS).contains("course_codes", [code]);
    return error ? [] : (data as Syllabus[]).sort((a, b) => syllabusTermOrder(b) - syllabusTermOrder(a));
}
