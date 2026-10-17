"use client";

import { useEffect } from "react";
import { useUniversity } from "@/components/university";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import type { ClassSession } from "@/lib/types";
import { storageKey } from "@/lib/university";
import { useScheduleStoreApi } from "./schedule-store";
import { useHydrated } from "./storage";

/** Waits this long after a change before saving, so picking several sections saves once. */
const SAVE_AFTER_MS = 800;

function byTerm(sessions: ClassSession[]): Map<string, ClassSession[]> {
    const terms = new Map<string, ClassSession[]>();
    for (const session of sessions) terms.set(session.term, [...(terms.get(session.term) ?? []), session]);
    return terms;
}

/**
 * The account's schedule plus anything planned in this browser before signing in. For a course in
 * both, the account's sections win.
 */
function merge(saved: Map<string, ClassSession[]>, local: ClassSession[]): ClassSession[] {
    const savedCourses = new Set([...saved.values()].flat().map((session) => `${session.term} ${session.course}`));
    return [
        ...[...saved.values()].flat(),
        ...local.filter((session) => !savedCourses.has(`${session.term} ${session.course}`)),
    ];
}

/**
 * Keeps a signed-in student's schedule in their account, one row per university and term, so it's the
 * same on every device. Signed-out visitors' schedules stay in the browser.
 *
 * The browser remembers whose schedule it holds. The first time someone signs in here, what they
 * planned signed out is merged into their account; after that the account is the source of truth. When
 * they sign out, this browser's copy is cleared so the next person doesn't see it.
 */
export function ScheduleSync() {
    const user = useUser();
    const userId = user === undefined ? undefined : (user?.id ?? null);
    const { id: university } = useUniversity();
    const store = useScheduleStoreApi();
    const hydrated = useHydrated(store);

    useEffect(() => {
        if (!hydrated || userId === undefined) return;
        const ownerKey = storageKey(university, "schedule-owner");
        const owner = localStorage.getItem(ownerKey);

        if (userId === null) {
            if (owner) {
                store.setState({ sessions: [] });
                localStorage.removeItem(ownerKey);
            }
            return;
        }

        const db = createClient();
        // Each term's sessions as last saved, so only terms that changed are written.
        const saved = new Map<string, string>();
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let unsubscribe = () => {};

        const save = async () => {
            const current = byTerm(store.getState().sessions);
            const rows = [...new Set([...current.keys(), ...saved.keys()])]
                .map((term) => ({ term, sessions: current.get(term) ?? [] }))
                .filter(({ term, sessions }) => saved.get(term) !== JSON.stringify(sessions))
                .map((row) => ({
                    ...row,
                    user_id: userId,
                    university_id: university,
                    updated_at: new Date().toISOString(),
                }));
            if (rows.length === 0) return;
            const { error } = await db.from("schedules").upsert(rows);
            if (error) console.error("Couldn't save the schedule to your account", error);
            else rows.forEach(({ term, sessions }) => saved.set(term, JSON.stringify(sessions)));
        };

        void (async () => {
            const { data, error } = await db.from("schedules").select("term, sessions").eq("university_id", university);
            // Without the account's copy (offline, say), the schedule stays in this browser for now.
            if (error || cancelled) return;
            const fromAccount = new Map(data.map((row) => [row.term as string, row.sessions as ClassSession[]]));
            fromAccount.forEach((sessions, term) => saved.set(term, JSON.stringify(sessions)));

            const local = store.getState().sessions;
            const sessions = owner === userId ? [...fromAccount.values()].flat() : merge(fromAccount, local);
            store.setState({ sessions });
            localStorage.setItem(ownerKey, userId);
            await save();

            unsubscribe = store.subscribe((state, previous) => {
                if (state.sessions === previous.sessions) return;
                clearTimeout(timer);
                timer = setTimeout(() => void save(), SAVE_AFTER_MS);
            });
        })();

        return () => {
            cancelled = true;
            unsubscribe();
            if (timer) {
                clearTimeout(timer);
                void save();
            }
        };
    }, [hydrated, userId, university, store]);

    return null;
}
