"use client";

import { useEffect, useState } from "react";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * State mirrored to localStorage. Stored objects are merged over `defaultValue` (or passed to `merge`), so
 * fields added in later versions still get their defaults for returning visitors.
 */
export function useStoredState<T>(defaultValue: T, key: string | null, merge?: (stored: Partial<T>) => T) {
    const [state, setState] = useState<T>(defaultValue);

    useEffect(() => {
        if (!key) return;
        try {
            const stored = localStorage.getItem(key);
            if (!stored || stored === "undefined") return;
            const parsed = JSON.parse(stored) as Partial<T>;
            if (merge) setState(merge(parsed));
            else
                setState(
                    isPlainObject(defaultValue) && isPlainObject(parsed)
                        ? { ...defaultValue, ...parsed }
                        : (parsed as T),
                );
        } catch (error) {
            console.error("Error reading from localStorage:", error);
        }
        // Only read once per key; defaultValue and merge are treated as initial values.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const setStateAndStore = (next: T | ((previous: T) => T)) => {
        setState((previous) => {
            const resolved = typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
            if (key) {
                try {
                    localStorage.setItem(key, JSON.stringify(resolved));
                } catch (error) {
                    console.error("Error writing to localStorage:", error);
                }
            }
            return resolved;
        });
    };

    return [state, setStateAndStore] as const;
}
