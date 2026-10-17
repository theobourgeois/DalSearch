"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUniversity } from "@/components/university";

async function post(path: string, body: object): Promise<string | null> {
    const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (response.ok) return null;
    return (
        ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong. Try again."
    );
}

/**
 * Shown instead of the review form to a student whose account belongs to another university. Reviews
 * only come from a university's own students, so a student cross-registered here confirms an address
 * at this university with an emailed code first.
 */
export function ConfirmUniversity({ onConfirmed }: { onConfirmed: () => void }) {
    const university = useUniversity();
    const [email, setEmail] = useState("");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        setError(null);
        try {
            await action();
        } finally {
            setBusy(false);
        }
    };

    const send = () =>
        run(async () => {
            const failure = await post("/api/student-universities/send-code", { email });
            if (failure) setError(failure);
            else setSentTo(email.trim().toLowerCase());
        });

    const confirm = () =>
        run(async () => {
            const failure = await post("/api/student-universities/confirm", { email: sentTo, code });
            if (failure) setError(failure);
            else onConfirmed();
        });

    return (
        <div className="rounded-card border border-line-strong p-5">
            <p className="text-[15px] font-bold">Reviews here come from {university.shortName} students</p>
            <p className="mt-1.5 max-w-[38rem] text-[14.5px] leading-relaxed text-fg-muted">
                {sentTo
                    ? `We sent a code to ${sentTo}. Enter it to review ${university.shortName} courses.`
                    : `Your account is from another school. If you take ${university.shortName} courses too, confirm your ${university.shortName} email and you can review them.`}
            </p>
            <form
                className="mt-4 flex flex-wrap gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    void (sentTo ? confirm() : send());
                }}
            >
                {sentTo ? (
                    <Input
                        key="code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        placeholder="6-digit code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        className="w-44"
                        aria-label="Code from the email"
                    />
                ) : (
                    <Input
                        key="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={university.emailExample}
                        className="w-72 max-w-full"
                        aria-label={`Your ${university.shortName} email`}
                    />
                )}
                <Button type="submit" disabled={busy || (sentTo ? code.trim().length < 6 : !email.includes("@"))}>
                    {sentTo ? "Confirm" : "Send code"}
                </Button>
                {sentTo && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setSentTo(null);
                            setCode("");
                            setError(null);
                        }}
                    >
                        Use a different email
                    </Button>
                )}
            </form>
            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}
        </div>
    );
}
