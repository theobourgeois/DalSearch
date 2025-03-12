"use client";
import { useEffect, useState } from "react";

// This hook is used to store a state in the local storage
export function useStoredState<T>(defaultValue: T, key: string | null) {
    const [state, setState] = useState<T>(defaultValue);

    useEffect(() => {
        if (!key) return;
        try {
            const storedState = localStorage?.getItem(key);
            if (storedState && storedState !== "undefined") {
                setState(JSON.parse(storedState));
            }
        } catch (error) {
            console.error(`Error reading from localStorage:`, error);
        }
    }, [key]);

    const setStateAndStore = (newState: T | ((prevState: T) => T)) => {
        setState((prevState) => {
            const resolvedState = typeof newState === "function"
                ? (newState as (prev: T) => T)(prevState)
                : newState;
            if (!key) return resolvedState;
            try {
                localStorage?.setItem(key, JSON.stringify(resolvedState));
            } catch (error) {
                console.error(`Error writing to localStorage:`, error);
            }
            return resolvedState;
        });
    };

    return [state, setStateAndStore] as const;
}
