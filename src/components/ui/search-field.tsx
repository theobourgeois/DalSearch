"use client";

import * as React from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type SearchFieldProps = Omit<React.ComponentProps<"input">, "size" | "onChange"> & {
    value: string;
    onValueChange: (value: string) => void;
    size?: "md" | "lg";
};

/** A rounded search input with an icon and a clear button. */
export const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
    ({ value, onValueChange, size = "md", className, ...props }, ref) => (
        <div
            className={cn(
                "flex w-full items-center gap-3 rounded-full border border-line-strong bg-panel transition-colors focus-within:border-fg-subtle",
                size === "lg" ? "h-14 pl-[22px] pr-3 text-base" : "h-12 pl-5 pr-2.5 text-[15px]",
                className,
            )}
        >
            <MagnifyingGlassIcon className="size-5 shrink-0 text-fg-muted" />
            <input
                ref={ref}
                type="search"
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent font-medium text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
                {...props}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onValueChange("")}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-raised hover:text-fg"
                    aria-label="Clear search"
                >
                    <XIcon className="size-4" />
                </button>
            )}
        </div>
    ),
);
SearchField.displayName = "SearchField";
