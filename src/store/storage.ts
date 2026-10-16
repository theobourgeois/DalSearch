import { useSyncExternalStore } from "react";
import type { PersistStorage, StorageValue } from "zustand/middleware";

function read<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

/**
 * localStorage-backed persistence for zustand. `migrateLegacy` builds the initial state from data saved by
 * an older version of the site, so returning visitors keep their schedule and history.
 */
export function localStorageWithLegacy<S>(migrateLegacy?: () => S | null): PersistStorage<S> {
    return {
        getItem: (name) => {
            const stored = read<StorageValue<S>>(name);
            if (stored) return stored;
            try {
                const legacy = migrateLegacy?.();
                return legacy ? { state: legacy, version: 0 } : null;
            } catch {
                return null;
            }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
    };
}

export function readLegacy<T>(key: string): T | null {
    return read<T>(key);
}

type PersistApi = {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
};

/** True once a persisted store has loaded from localStorage (always false during server rendering). */
export function useHydrated(store: { persist: PersistApi }): boolean {
    return useSyncExternalStore(store.persist.onFinishHydration, store.persist.hasHydrated, () => false);
}
