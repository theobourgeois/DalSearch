"use client";

import { usePathname, useRouter } from "next/navigation";
import { CaretUpDownIcon } from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUniversity } from "@/components/university";
import { UniversityLogo } from "./university-logo";
import { splitUniversityPath, universities, universityPath } from "@/lib/university";

/** Pages every university has; anything else (a course, a room, an account page) opens the other's home. */
const sharedPages = /^\/(explore|schedule|rooms|instructors)$/;

/** Shows which university the site is on and switches to another, staying on the same page where it can. */
export function UniversitySwitcher({ onNavigate }: { onNavigate?: () => void }) {
    const current = useUniversity();
    const pathname = usePathname();
    const router = useRouter();
    const { path } = splitUniversityPath(pathname);

    const switchTo = (id: string) => {
        if (id === current.id) return;
        onNavigate?.();
        router.push(universityPath(id, sharedPages.test(path) ? path : "/"));
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="mx-2 mt-3 flex max-w-full items-center gap-2 self-start rounded-full text-[13px] font-bold text-fg-muted transition-colors hover:text-fg"
                >
                    <UniversityLogo university={current} />
                    <span className="truncate">{current.name}</span>
                    <CaretUpDownIcon className="size-3.5 shrink-0" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[70vh] overflow-y-auto">
                <DropdownMenuLabel>University</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={current.id} onValueChange={switchTo}>
                    {[...universities]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((university) => (
                            <DropdownMenuRadioItem key={university.id} value={university.id} className="gap-2.5">
                                <UniversityLogo university={university} />
                                {university.name}
                            </DropdownMenuRadioItem>
                        ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
