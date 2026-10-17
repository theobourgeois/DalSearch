"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { formatCourseCode } from "@/lib/schedule";
import { formatWeight, type GradingScheme, type Textbook } from "@/lib/syllabi";
import { createClient } from "@/lib/supabase/client";
import { getUniversity, universityPath } from "@/lib/university";

type Upload = {
    id: string;
    university_id: string;
    course_code: string;
    file_path: string;
    file_name: string;
    created_at: string;
    details: {
        term_season: string | null;
        term_year: number | null;
        instructors: string[];
        grading_schemes: GradingScheme[];
        textbooks: Textbook[];
        policies: { topic: string }[];
        weekly_topics: unknown[];
    };
};

/** One line per grading scheme: "Midterm 30%, Final 40%, Labs 30%". */
const grading = (schemes: GradingScheme[]) =>
    schemes.map((scheme) =>
        scheme.components
            .map((component) =>
                component.weight === null ? component.name : `${component.name} ${formatWeight(component.weight)}`,
            )
            .join(", "),
    );

/**
 * Syllabi students shared, waiting for a moderator: what the model read next to a link to the PDF, so
 * the two can be compared before the facts go on the course page.
 */
export function SyllabusUploads() {
    const [uploads, setUploads] = useState<Upload[] | null>(null);

    useEffect(() => {
        void createClient()
            .from("syllabus_uploads")
            .select("id, university_id, course_code, file_path, file_name, created_at, details")
            .eq("status", "pending")
            .order("created_at")
            .then(({ data }) => setUploads((data ?? []) as Upload[]));
    }, []);

    const openPdf = async (upload: Upload) => {
        const { data } = await createClient().storage.from("syllabus-uploads").createSignedUrl(upload.file_path, 600);
        if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noreferrer");
        else toast("Couldn't open the PDF.");
    };

    const decide = async (upload: Upload, action: "approve" | "reject") => {
        const reason =
            action === "reject" ? window.prompt("Why? The student won't see this, it's for the record.") : null;
        if (action === "reject" && reason === null) return;
        const response = await fetch("/api/syllabi/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: upload.id, action, reason }),
        });
        if (response.ok) setUploads((current) => current?.filter((item) => item.id !== upload.id) ?? null);
        toast(
            response.ok
                ? action === "approve"
                    ? "Published on the course page"
                    : "Rejected"
                : "Something went wrong. Try again.",
        );
    };

    return (
        <section className="mt-10">
            <SectionHeader title="Shared syllabi" />
            {uploads?.length === 0 && <EmptyState className="mt-4" title="No syllabi waiting" />}
            <div className="mt-2 divide-y divide-line">
                {uploads?.map((upload) => {
                    const { details } = upload;
                    const term = [details.term_season, details.term_year].filter(Boolean).join(" ");
                    return (
                        <article key={upload.id} className="flex gap-4 py-5">
                            <div className="min-w-0 flex-1 text-sm">
                                <p className="font-bold">
                                    <Link
                                        href={universityPath(upload.university_id, `/${upload.course_code}`)}
                                        className="hover:underline"
                                    >
                                        {formatCourseCode(upload.course_code)}
                                    </Link>
                                    <span className="font-medium text-fg-subtle">
                                        {" "}
                                        at {getUniversity(upload.university_id)?.shortName ?? upload.university_id}
                                        {term && `, ${term}`}
                                        {details.instructors.length > 0 && `, ${details.instructors.join(" and ")}`}
                                    </span>
                                </p>
                                <ul className="mt-2 space-y-1 text-fg-muted">
                                    {grading(details.grading_schemes).map((line, index) => (
                                        <li key={index}>{line}</li>
                                    ))}
                                    <li className="text-fg-subtle">
                                        {[
                                            `${details.textbooks.length} textbooks`,
                                            `${details.policies.length} rules`,
                                            `${details.weekly_topics.length} weekly topics`,
                                        ].join(", ")}
                                    </li>
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => openPdf(upload)}
                                    className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-bold text-fg-muted hover:text-fg"
                                >
                                    {upload.file_name}
                                    <ArrowUpRightIcon className="size-3.5" />
                                </button>
                            </div>
                            <div className="flex shrink-0 items-start gap-1">
                                <SimpleTooltip label="Publish">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Publish"
                                        onClick={() => decide(upload, "approve")}
                                    >
                                        <CheckIcon />
                                    </Button>
                                </SimpleTooltip>
                                <SimpleTooltip label="Reject">
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="Reject"
                                        onClick={() => decide(upload, "reject")}
                                    >
                                        <XIcon />
                                    </Button>
                                </SimpleTooltip>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
