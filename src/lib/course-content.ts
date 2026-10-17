import "server-only";

import { RMP_REVIEW_COLUMNS, type RmpReview } from "./rmp-reviews";
import { publicClient } from "./supabase/public";
import { SYLLABUS_COLUMNS, syllabusTermOrder, type Syllabus } from "./syllabi";
import type { CourseAndSubjectCode } from "./types";
import { UNIVERSITY_ID } from "./university";

/**
 * Reads the scraped tables shown on course pages. They're read per course rather than with the rest
 * of the catalog because moderators can hide reviews, and the course page is revalidated when they do.
 */

/** RateMyProfessors reviews that mention the course, newest first. Empty if they can't be loaded. */
export async function getRmpReviews(code: CourseAndSubjectCode): Promise<RmpReview[]> {
    const { data, error } = await publicClient()
        .from("external_reviews")
        .select(RMP_REVIEW_COLUMNS)
        .eq("university_id", UNIVERSITY_ID)
        .eq("source", "rmp")
        .eq("course_code", code)
        .order("reviewed_at", { ascending: false });
    return error ? [] : (data as RmpReview[]);
}

/** Public syllabi for the course, latest term first. Empty if they can't be loaded. */
export async function getSyllabi(code: CourseAndSubjectCode): Promise<Syllabus[]> {
    const { data, error } = await publicClient()
        .from("syllabi")
        .select(SYLLABUS_COLUMNS)
        .eq("university_id", UNIVERSITY_ID)
        .contains("course_codes", [code]);
    return error ? [] : (data as Syllabus[]).sort((a, b) => syllabusTermOrder(b) - syllabusTermOrder(a));
}
