"use client";

import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon } from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { focusRing } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";
export type SortState<T extends string> = { key: T; direction: SortDirection };

type SortMenuProps<T extends string> = {
    value: SortState<T>;
    options: { value: T; label: string }[];
    onChange: (value: SortState<T>) => void;
};

/** "Sort by Course code ↑", with a choice of field and direction. */
export function SortMenu<T extends string>({ value, options, onChange }: SortMenuProps<T>) {
    const current = options.find((option) => option.value === value.key);
    const DirectionIcon = value.direction === "asc" ? ArrowUpIcon : ArrowDownIcon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn("flex items-center gap-1.5 rounded-full text-sm font-medium text-fg-subtle", focusRing)}
            >
                Sort by <span className="font-bold text-fg">{current?.label}</span>
                <DirectionIcon
                    className="size-3.5 text-fg"
                    aria-label={value.direction === "asc" ? "ascending" : "descending"}
                />
                <CaretDownIcon className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuRadioGroup
                    value={value.key}
                    onValueChange={(key) => onChange({ ...value, key: key as T })}
                >
                    {options.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={option.value}>
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={value.direction}
                    onValueChange={(direction) => onChange({ ...value, direction: direction as SortDirection })}
                >
                    <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
