"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { Combobox } from "@/components/ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUniversity } from "@/components/university";
import { splitUniversityPath, universities, universityPath, type University } from "@/lib/university";
import { cn } from "@/lib/utils";
import { UniversityLogo } from "./university-logo";

/** Pages every university has; anything else (a course, a room, an account page) opens the other's home. */
const sharedPages = /^\/(explore|schedule|rooms|instructors)$/;

const sorted = [...universities].sort((a, b) => a.name.localeCompare(b.name));

/** Schools whose name, short name or id contains the query: "sask", "UPEI", "victoria". */
function matching(query: string): University[] {
    const wanted = query.trim().toLowerCase();
    if (!wanted) return sorted;
    return sorted.filter((university) =>
        [university.name, university.shortName, university.id].some((text) => text.toLowerCase().includes(wanted)),
    );
}

/**
 * The university the site is showing, at the top of the sidebar, and a searchable list to switch to
 * another, staying on the same page where it can.
 */
export function UniversitySwitcher({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
    const current = useUniversity();
    const pathname = usePathname();
    const router = useRouter();
    const { path } = splitUniversityPath(pathname);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const results = matching(query);

    const switchTo = (university: University) => {
        setOpen(false);
        setQuery("");
        if (university.id === current.id) return;
        onNavigate?.();
        router.push(universityPath(university.id, sharedPages.test(path) ? path : "/"));
    };

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (!next) setQuery("");
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex min-w-0 max-w-full items-center gap-2.5 rounded-full py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-raised",
                        className,
                    )}
                >
                    <UniversityLogo university={current} className="size-6" />
                    <span className="min-w-0 truncate text-[15px] font-bold">{current.name}</span>
                    <CaretUpDownIcon className="size-4 shrink-0 text-fg-subtle" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[22rem] max-w-[calc(100vw-1.5rem)] p-2">
                <Combobox
                    inline
                    autoFocus
                    query={query}
                    onQueryChange={setQuery}
                    items={results}
                    getKey={(university) => university.id}
                    onSelect={switchTo}
                    label="Find your university"
                    placeholder="Find your university"
                    renderItem={(university) => (
                        <>
                            <UniversityLogo university={university} />
                            <span className="min-w-0 flex-1 font-medium">{university.name}</span>
                            {university.id === current.id && <CheckIcon className="size-4 shrink-0 text-fg-muted" />}
                        </>
                    )}
                />
                {results.length === 0 && (
                    <p className="px-4 pb-2 pt-4 text-sm text-fg-muted">
                        No university matches &ldquo;{query.trim()}&rdquo; yet.
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
}
