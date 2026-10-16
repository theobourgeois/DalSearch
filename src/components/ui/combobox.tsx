"use client";

import { forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchField } from "./search-field";

type ComboboxProps<T> = {
    query: string;
    onQueryChange: (query: string) => void;
    /** The items matching the current query. */
    items: T[];
    getKey: (item: T) => string;
    renderItem: (item: T) => React.ReactNode;
    onSelect: (item: T) => void;
    label: string;
    placeholder?: string;
    size?: "md" | "lg";
    autoFocus?: boolean;
    /** Render results in the page flow (e.g. inside a dialog) instead of a floating dropdown. */
    inline?: boolean;
    className?: string;
};

function ComboboxInner<T>(
    {
        query,
        onQueryChange,
        items,
        getKey,
        renderItem,
        onSelect,
        label,
        placeholder,
        size = "md",
        autoFocus,
        inline = false,
        className,
    }: ComboboxProps<T>,
    ref: React.ForwardedRef<HTMLInputElement>,
) {
    const listId = useId();
    const [activeIndex, setActiveIndex] = useState(0);
    const [focused, setFocused] = useState(false);
    const open = items.length > 0 && (inline || focused);

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((index) => (index + step + items.length) % items.length);
        } else if (event.key === "Enter") {
            event.preventDefault();
            onSelect(items[activeIndex] ?? items[0]);
        } else if (event.key === "Escape") {
            onQueryChange("");
        }
    };

    return (
        <div className={cn("relative", className)}>
            <SearchField
                ref={ref}
                value={query}
                onValueChange={(value) => {
                    onQueryChange(value);
                    setActiveIndex(0);
                }}
                size={size}
                placeholder={placeholder}
                autoFocus={autoFocus}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-label={label}
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
            />
            {open && (
                <ul
                    id={listId}
                    role="listbox"
                    className={cn(
                        "flex max-h-[22rem] flex-col gap-0.5 overflow-y-auto p-1.5",
                        inline
                            ? "mt-3"
                            : "absolute inset-x-0 top-full z-40 mt-2 rounded-card border border-line bg-panel shadow-[0_24px_60px_-18px_rgb(0_0_0/0.35)]",
                    )}
                >
                    {items.map((item, index) => (
                        <li
                            key={getKey(item)}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === activeIndex}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => onSelect(item)}
                            className={cn(
                                "flex cursor-pointer items-center gap-4 rounded-row px-4 py-3 text-sm",
                                index === activeIndex && "bg-raised",
                            )}
                        >
                            {renderItem(item)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** A search field with a keyboard-navigable list of matches; the ref points at the input. */
export const Combobox = forwardRef(ComboboxInner) as <T>(
    props: ComboboxProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => React.ReactElement;
