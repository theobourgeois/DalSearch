"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Admin = { email: string; role: string };

async function updateAdmin(action: "assign" | "deassign", email: string): Promise<string | null> {
    try {
        const response = await fetch(`/api/admins/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        if (response.ok) return null;
        const data = (await response.json()) as { error?: string };
        return data.error ?? "Something went wrong.";
    } catch {
        return "Something went wrong.";
    }
}

/** Lets the site owner add and remove admins. */
export function AdminList({ admins }: { admins: Admin[] }) {
    const [list, setList] = useState(admins);
    const [email, setEmail] = useState("");

    const assign = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!window.confirm(`Make ${email} an admin?`)) return;
        const error = await updateAdmin("assign", email);
        if (error) return toast(`Couldn't add admin: ${error}`);
        setList((current) => [...current, { email, role: "admin" }]);
        setEmail("");
        toast(`${email} is now an admin`);
    };

    const remove = async (target: string) => {
        if (!window.confirm(`Remove ${target} as an admin?`)) return;
        const error = await updateAdmin("deassign", target);
        if (error) return toast(`Couldn't remove admin: ${error}`);
        setList((current) => current.filter((admin) => admin.email !== target));
        toast(`${target} is no longer an admin`);
    };

    return (
        <section className="mt-10">
            <SectionHeader title="Admins" />
            <ul className="mt-3 flex flex-col">
                {list.length === 0 && <li className="py-3 text-sm text-fg-subtle">No admins yet.</li>}
                {list.map((admin) => (
                    <li
                        key={admin.email}
                        className="flex items-center justify-between border-b border-line py-3 text-sm font-medium last:border-b-0"
                    >
                        {admin.email}
                        <Button size="sm" variant="ghost" onClick={() => remove(admin.email)}>
                            Remove
                        </Button>
                    </li>
                ))}
            </ul>
            <form onSubmit={assign} className="mt-4 flex max-w-lg gap-2">
                <Input
                    type="email"
                    required
                    placeholder="Email address"
                    aria-label="New admin email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <Button type="submit" variant="primary" className="h-11">
                    Add admin
                </Button>
            </form>
        </section>
    );
}
