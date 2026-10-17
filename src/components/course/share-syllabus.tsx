"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { FileArrowUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useHref, useUniversity } from "@/components/university";
import { useUser } from "@/hooks/use-user";
import { courseKey, formatCourseCode } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/client";
import { joinWords } from "@/lib/utils";
import { useCourse } from "./course-context";

const MAX_BYTES = 10 * 1024 * 1024;

type Read = { term: string | null; instructors: string[]; gradedOn: string[] };
type State =
    { step: "idle" } | { step: "reading" } | { step: "done"; read: Read } | { step: "failed"; message: string };

/** What the model found, in a sentence: "the Winter 2026 syllabus by Tracy Moniz, graded on a midterm and a final". */
function describe({ term, instructors, gradedOn }: Read): string {
    const by = instructors.length > 0 ? ` by ${joinWords(instructors.slice(0, 2))}` : "";
    const graded =
        gradedOn.length > 0 ? `, graded on ${joinWords(gradedOn.slice(0, 4).map((name) => name.toLowerCase()))}` : "";
    return `the ${term ? `${term} ` : ""}syllabus${by}${graded}`;
}

/**
 * Lets a student share a course's syllabus PDF. The file goes to private storage, the server reads it
 * straight away and turns away anything that isn't this course's syllabus, and a moderator checks the
 * rest before it shows on the page. `prominent` is for courses with no syllabus yet.
 */
export function ShareSyllabus({ prominent }: { prominent: boolean }) {
    const { course } = useCourse();
    const { id: university } = useUniversity();
    const pagePath = useHref();
    const user = useUser();
    const input = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<State>({ step: "idle" });
    const code = courseKey(course);

    const share = async (file: File | undefined) => {
        if (!file || !user) return;
        if (file.type !== "application/pdf")
            return setState({ step: "failed", message: "Share the syllabus as a PDF." });
        if (file.size > MAX_BYTES) return setState({ step: "failed", message: "That PDF is over 10 MB." });

        setState({ step: "reading" });
        const path = `${user.id}/${crypto.randomUUID()}.pdf`;
        const { error } = await createClient()
            .storage.from("syllabus-uploads")
            .upload(path, file, { contentType: "application/pdf" });
        if (error) return setState({ step: "failed", message: "Couldn't upload the file. Try again." });

        const response = await fetch("/api/syllabi/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ university, course: code, path, fileName: file.name }),
        }).catch(() => null);
        const body = await response?.json().catch(() => null);
        if (!response?.ok) {
            return setState({ step: "failed", message: body?.error ?? "Couldn't read the file. Try again." });
        }
        setState({ step: "done", read: body });
    };

    const picker = (
        <input
            ref={input}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(event) => {
                void share(event.target.files?.[0]);
                event.target.value = "";
            }}
        />
    );
    const pick = () => input.current?.click();

    if (state.step === "reading") {
        return (
            <p className="mt-4 text-sm font-medium text-fg-muted">Reading your syllabus. This takes a few seconds…</p>
        );
    }
    if (state.step === "done") {
        return (
            <p className="mt-4 max-w-[42rem] text-sm text-fg-muted">
                <span className="font-bold text-fg">Thanks!</span> We read {describe(state.read)}. A moderator will
                check it before it shows here.
            </p>
        );
    }

    const failed = state.step === "failed" && (
        <p className="mt-2 text-[13px] font-medium text-danger">{state.message}</p>
    );
    const action =
        user === undefined ? null : user ? (
            <Button size="sm" onClick={pick}>
                <FileArrowUpIcon />
                {state.step === "failed" ? "Try another file" : "Share a syllabus"}
            </Button>
        ) : (
            <Button size="sm" asChild>
                <Link href={pagePath("/auth/login")}>Sign in to share</Link>
            </Button>
        );

    if (!prominent) {
        return (
            <div className="mt-5">
                {picker}
                <p className="text-[13px] text-fg-subtle">
                    Have a more recent syllabus for {formatCourseCode(code)}?{" "}
                    {user ? (
                        <button type="button" onClick={pick} className="font-bold text-fg-muted hover:text-fg">
                            Share it
                        </button>
                    ) : (
                        <Link href={pagePath("/auth/login")} className="font-bold text-fg-muted hover:text-fg">
                            Sign in to share it
                        </Link>
                    )}
                </p>
                {failed}
            </div>
        );
    }

    return (
        <div className="mt-4">
            {picker}
            <div className="flex items-center gap-3 rounded-full border border-line-strong py-2 pl-5 pr-2">
                <span className="min-w-0 flex-1 text-[15px] font-medium text-fg-subtle">
                    Have the syllabus for {formatCourseCode(code)}? Share it and everyone gets the grading, textbooks
                    and rules.
                </span>
                {action}
            </div>
            {failed}
        </div>
    );
}
