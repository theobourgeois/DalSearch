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
                    "relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors",
                    checked ? "bg-fg" : "bg-line-strong",
                )}
            >
                <span
                    className={cn(
                        "absolute top-[3px] size-4 rounded-full bg-panel shadow transition-transform",
                        checked ? "translate-x-[19px]" : "translate-x-[3px]",
                    )}
                />
            </span>
            {label}
        </button>
    );
}
