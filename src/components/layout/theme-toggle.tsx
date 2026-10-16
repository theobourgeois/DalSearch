"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const options = [
    { value: "light", label: "Light theme", Icon: SunIcon },
    { value: "dark", label: "Dark theme", Icon: MoonIcon },
] as const;

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="flex rounded-full border border-line p-1" role="radiogroup" aria-label="Theme">
            {options.map(({ value, label, Icon }) => {
                const active = mounted && resolvedTheme === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={label}
                        onClick={() => setTheme(value)}
                        className={cn(
                            "grid size-7 place-items-center rounded-full text-fg-subtle transition-colors hover:text-fg",
                            active && "bg-fg text-panel hover:text-panel",
                        )}
                    >
                        <Icon className="size-4" />
                    </button>
                );
            })}
        </div>
    );
}
