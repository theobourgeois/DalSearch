"use client";

import { useState } from "react";
import { StarIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type StarInputProps = {
    label: string;
    value: number;
    onChange: (value: number) => void;
};

/** A 1-5 rating picker. */
export function StarInput({ label, value, onChange }: StarInputProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const shown = hovered ?? value;

    return (
        <div
            className="flex items-center gap-0.5"
            role="radiogroup"
            aria-label={label}
            onMouseLeave={() => setHovered(null)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star} out of 5`}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHovered(star)}
                    className="rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                    <StarIcon
                        weight="fill"
                        className={cn("size-6 transition-colors", star <= shown ? "text-accent" : "text-block")}
                    />
                </button>
            ))}
        </div>
    );
}
