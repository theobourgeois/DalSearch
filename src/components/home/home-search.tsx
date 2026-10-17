"use client";

import { useRef, useState } from "react";
import { CourseSearch } from "@/components/search/course-search";
import { useLibraryStore, useLibraryStoreApi } from "@/store/library-store";
import { useHydrated } from "@/store/storage";

/** The big search on the home page, with the student's recent searches underneath. */
export function HomeSearch() {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const recentQueries = useLibraryStore((state) => state.recentQueries);
    const ready = useHydrated(useLibraryStoreApi());

    return (
        <div className="mt-7">
            <CourseSearch
                ref={inputRef}
                size="lg"
                query={query}
                onQueryChange={setQuery}
                placeholder='Try "CSCI 2122" or "databases"'
            />
            {ready && recentQueries.length > 0 && (
                <div className="mt-3.5 flex flex-wrap items-center gap-2 pl-1">
                    <span className="mr-1 text-[13.5px] font-medium text-fg-subtle">Recent</span>
                    {recentQueries.map((recent) => (
                        <button
                            key={recent}
                            type="button"
                            onClick={() => {
                                setQuery(recent);
                                inputRef.current?.focus();
                            }}
                            className="h-8 rounded-full bg-raised px-3.5 text-[13.5px] font-bold transition-colors hover:bg-block"
                        >
                            {recent}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
