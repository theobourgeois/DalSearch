"use client";

import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

export type SegmentedOption<T extends string> = {
    value: T;
    label: React.ReactNode;
    disabled?: boolean;
};

type SegmentedControlProps<T extends string> = {
    value: T;
    onValueChange: (value: T) => void;
    options: SegmentedOption<T>[];
    "aria-label": string;
    className?: string;
};

/** A pill-shaped single-choice control, used for terms, views and buffers. */
export function SegmentedControl<T extends string>({
    value,
    onValueChange,
    options,
    className,
    ...props
}: SegmentedControlProps<T>) {
    return (
        <ToggleGroup.Root
            type="single"
            value={value}
            onValueChange={(next) => next && onValueChange(next as T)}
            className={cn(
                "inline-flex max-w-full shrink-0 overflow-x-auto rounded-full bg-raised p-1 [scrollbar-width:none]",
                className,
            )}
            aria-label={props["aria-label"]}
        >
            {options.map((option) => (
                <ToggleGroup.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                        "whitespace-nowrap rounded-full font-bold text-fg-muted transition-colors hover:text-fg",
                        "data-[state=on]:bg-panel data-[state=on]:text-fg data-[state=on]:shadow-[0_0_0_1px_var(--line-strong)]",
                        "disabled:cursor-not-allowed disabled:font-medium disabled:text-fg-subtle disabled:line-through",
                        "h-[30px] px-3.5 text-[13px]",
                        focusRing,
                    )}
                >
                    {option.label}
                </ToggleGroup.Item>
            ))}
        </ToggleGroup.Root>
    );
}
