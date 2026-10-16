"use client";

import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

type SwitchProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: React.ReactNode;
    className?: string;
};

/** A labelled on/off toggle. */
export function Switch({ checked, onCheckedChange, label, className }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "group inline-flex items-center gap-2.5 rounded-full text-sm font-medium text-fg-muted transition-colors hover:text-fg",
                focusRing,
                className,
            )}
        >
            <span
                className={cn(
                    "flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors",
                    checked ? "bg-fg" : "bg-line-strong",
                )}
            >
                <span
                    className={cn(
                        "size-4 rounded-full shadow-sm transition-transform",
                        checked ? "translate-x-4 bg-panel" : "bg-white dark:bg-fg-muted",
                    )}
                />
            </span>
            {label}
        </button>
    );
}
