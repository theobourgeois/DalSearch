"use client";
import { useEffect, useState } from "react";

const localStorage: Storage | null = null;

// This hook is used to store a state in the local storage
export function useStoredState<T>(defaultValue: T, key: string) {
    const [state, setState] = useState<T>(() => {
        const storedState = localStorage?.getItem(key);
        return storedState && storedState !== "undefined"
            ? JSON.parse(storedState)
            : defaultValue;
    });

    useEffect(() => {
        localStorage?.setItem(key, JSON.stringify(state));
    }, [state, key]);

    const set: typeof setState = (newState: T | ((prevState: T) => T)) => {
        setState((prevState) => {
            const resolvedState = typeof newState === "function"
                ? (newState as (prev: T) => T)(prevState)
                : newState;
            localStorage?.setItem(key, JSON.stringify(resolvedState));
            return resolvedState;
        });
    };

    return [state, set] as const;
}
