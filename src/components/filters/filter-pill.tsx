"use client";

import { forwardRef, useMemo, useState } from "react";
import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { focusRing } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

type FilterPillTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    value?: string;
};

/** The button part of a filter pill: "Level 2000, 3000 ▾". */
export const FilterPillTrigger = forwardRef<HTMLButtonElement, FilterPillTriggerProps>(
    ({ label, value, className, ...props }, ref) => (
        <button
            ref={ref}
            type="button"
            className={cn(
                "flex h-full items-center gap-1.5 whitespace-nowrap rounded-full pl-3.5 pr-3",
                focusRing,
                className,
            )}
            {...props}
        >
            {value ? (
                <>
                    <span className="font-medium text-fg-subtle">{label}</span>
                    <span className="max-w-[12rem] truncate">{value}</span>
                </>
            ) : (
                label
            )}
            <CaretDownIcon className="size-3.5 text-fg-subtle" />
        </button>
    ),
);
FilterPillTrigger.displayName = "FilterPillTrigger";

type FilterPillProps = {
    label: string;
    children: React.ReactNode;
    /** When set, the pill looks active and shows a clear button. */
    onClear?: () => void;
    className?: string;
};

/** A rounded filter control. */
export function FilterPill({ label, children, onClear, className }: FilterPillProps) {
    return (
        <div
            className={cn(
                "flex h-9 shrink-0 items-center rounded-full text-[13.5px] font-bold text-fg",
                onClear ? "bg-raised" : "border border-line-strong",
                className,
            )}
        >
            {children}
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label={`Clear ${label.toLowerCase()} filter`}
                    className={cn(
                        "-ml-1.5 mr-1.5 grid size-6 place-items-center rounded-full text-fg-subtle hover:bg-block hover:text-fg",
                        focusRing,
                    )}
                >
                    <XIcon className="size-3.5" />
                </button>
            )}
        </div>
    );
}

export type FilterOption<T> = { value: T; label: string };

type SingleSelectFilterProps<T extends string | number> = {
    label: string;
    options: FilterOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** The "no filter" value: the pill shows no selection and no clear button while it's chosen. */
    emptyValue?: T;
    /** Text shown on the pill for the current value. */
    summary?: (option: FilterOption<T>) => string;
};

/** A filter pill that opens a single-choice menu. */
export function SingleSelectFilter<T extends string | number>({
    label,
    options,
    value,
    onChange,
    emptyValue,
    summary = (option) => option.label,
}: SingleSelectFilterProps<T>) {
    const current = options.find((option) => option.value === value);
    const active = emptyValue === undefined ? current : value !== emptyValue ? current : undefined;

    return (
        <FilterPill label={label} onClear={active && emptyValue !== undefined ? () => onChange(emptyValue) : undefined}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <FilterPillTrigger label={label} value={active ? summary(active) : undefined} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuRadioGroup
                        value={String(value)}
                        onValueChange={(next) => {
                            const option = options.find((candidate) => String(candidate.value) === next);
                            if (option) onChange(option.value);
                        }}
                    >
                        {options.map((option) => (
                            <DropdownMenuRadioItem key={option.value} value={String(option.value)}>
                                {option.label}
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </FilterPill>
    );
}

type MultiSelectFilterProps<T> = {
    label: string;
    options: FilterOption<T>[];
    selected: T[];
    onChange: (selected: T[]) => void;
    /** Text shown on the pill for the current selection. */
    summary?: (selected: FilterOption<T>[]) => string;
    searchPlaceholder?: string;
};

function defaultSummary<T>(selected: FilterOption<T>[]) {
    return selected.length === 1 ? selected[0].label : `${selected.length} selected`;
}

/** A filter pill that opens a checklist. An empty selection means "any". */
export function MultiSelectFilter<T extends string | number>({
    label,
    options,
    selected,
    onChange,
    summary = defaultSummary,
    searchPlaceholder,
}: MultiSelectFilterProps<T>) {
    const [query, setQuery] = useState("");
    const chosen = options.filter((option) => selected.includes(option.value));
    const visible = useMemo(
        () => options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())),
        [options, query],
    );

    const toggle = (value: T, checked: boolean) =>
        onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));

    return (
        <FilterPill label={label} onClear={chosen.length > 0 ? () => onChange([]) : undefined}>
            <Popover onOpenChange={() => setQuery("")}>
                <PopoverTrigger asChild>
                    <FilterPillTrigger label={label} value={chosen.length > 0 ? summary(chosen) : undefined} />
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1.5">
                    {searchPlaceholder && (
                        <input
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            className="mb-1 h-10 w-full rounded-full bg-raised px-4 text-sm font-medium outline-none placeholder:text-fg-subtle"
                        />
                    )}
                    <div className="max-h-72 overflow-y-auto">
                        {visible.map((option) => {
                            const checked = selected.includes(option.value);
                            return (
                                <label
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-3 rounded-row px-3 py-2 text-sm font-medium hover:bg-raised"
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(value) => toggle(option.value, value === true)}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </label>
                            );
                        })}
                        {visible.length === 0 && <p className="px-3 py-2 text-sm text-fg-subtle">No matches</p>}
                    </div>
                </PopoverContent>
            </Popover>
        </FilterPill>
    );
}
