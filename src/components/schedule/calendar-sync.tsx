"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHref } from "@/components/university";
import { useUser } from "@/hooks/use-user";
import { SITE_NAME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

type Links = { feed: string; google: string; apple: string; outlook: string };

/** Where each calendar app subscribes to a feed. Apple's webcal: link opens the Calendar app itself. */
function calendarLinks(origin: string, token: string): Links {
    const feed = `${origin}/api/calendar/${token}.ics`;
    const webcal = feed.replace(/^https?:/, "webcal:");
    return {
        feed,
        google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
        apple: webcal,
        // Students' Outlook is their school's Microsoft 365, not outlook.com.
        outlook: `https://outlook.office.com/calendar/0/addfromweb?url=${encodeURIComponent(feed)}&name=${SITE_NAME}`,
    };
}

const apps: { key: keyof Omit<Links, "feed">; label: string; newTab: boolean }[] = [
    { key: "google", label: "Google Calendar", newTab: true },
    { key: "apple", label: "Apple Calendar", newTab: false },
    { key: "outlook", label: "Outlook", newTab: true },
];

/** The student's calendar feed token, made the first time they ask for it. */
async function feedToken(userId: string): Promise<string> {
    const db = createClient();
    const existing = await db.from("calendar_feeds").select("token").maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data.token;
    const created = await db.from("calendar_feeds").insert({ user_id: userId }).select("token").single();
    if (created.error) throw created.error;
    return created.data.token;
}

/**
 * Subscribes the student's calendar app to their schedule. The feed is every term saved to their
 * account, so it changes as they plan; signed-out schedules live only in the browser and can't be fed.
 */
export function CalendarSync() {
    const user = useUser();
    const pagePath = useHref();
    const [token, setToken] = useState<string | null>(null);
    const links = token ? calendarLinks(window.location.origin, token) : null;

    const load = async () => {
        if (!user || token) return;
        try {
            setToken(await feedToken(user.id));
        } catch {
            toast("Couldn't load your calendar link. Try again in a moment.");
        }
    };

    const copy = async (feed: string) => {
        await navigator.clipboard.writeText(feed);
        toast("Link copied. Add it in your calendar app as a subscription.");
    };

    const reset = async () => {
        if (!user || !window.confirm("Calendars using your current link will stop updating. Reset it?")) return;
        const db = createClient();
        const { error } = await db.from("calendar_feeds").delete().eq("user_id", user.id);
        if (error) return toast("Couldn't reset your calendar link.");
        setToken(null);
        try {
            setToken(await feedToken(user.id));
            toast("Link reset. Add your calendar again to keep it updating.");
        } catch {
            toast("Couldn't make a new calendar link. Try again in a moment.");
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && void load()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Add to your calendar">
                    <CalendarPlusIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Add to your calendar</DropdownMenuLabel>
                {user ? (
                    <>
                        {apps.map((app) => (
                            <DropdownMenuItem key={app.key} asChild disabled={!links}>
                                <a
                                    href={links?.[app.key]}
                                    target={app.newTab ? "_blank" : undefined}
                                    rel={app.newTab ? "noopener noreferrer" : undefined}
                                >
                                    {app.label}
                                </a>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem disabled={!links} onSelect={() => links && void copy(links.feed)}>
                            Copy link for another app
                        </DropdownMenuItem>
                        <p className="px-3 pb-2 pt-1 text-[13px] text-fg-subtle">
                            Every term you plan and its final exams. Calendar apps check for changes every few
                            hours, Google about once a day.
                        </p>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={!links} onSelect={() => void reset()}>
                            Reset link
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <p className="px-3 pb-2 pt-1 text-[13px] text-fg-subtle">
                            Sign in and your calendar app follows your schedule as you change it.
                        </p>
                        <DropdownMenuItem asChild>
                            <Link href={pagePath("/auth/login")}>Sign in</Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
