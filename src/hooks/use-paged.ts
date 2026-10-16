"use client";

import { useState } from "react";

/** Shows a list a page at a time. Call `reset` when the list's filters change. */
export function usePaged<T>(items: T[], pageSize: number) {
    const [count, setCount] = useState(pageSize);
    return {
        visible: items.slice(0, count),
        remaining: Math.max(0, items.length - count),
        nextPageSize: Math.min(pageSize, Math.max(0, items.length - count)),
        showMore: () => setCount((current) => current + pageSize),
        reset: () => setCount(pageSize),
    };
}
