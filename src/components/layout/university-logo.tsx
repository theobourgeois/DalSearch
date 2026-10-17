import Image from "next/image";
import type { University } from "@/lib/university";
import { cn } from "@/lib/utils";

/** The university's crest or symbol, beside its name. */
export function UniversityLogo({ university, className }: { university: University; className?: string }) {
    return (
        <>
            <Image
                src={university.logo}
                alt=""
                width={20}
                height={20}
                unoptimized
                className={cn("size-5 shrink-0 object-contain", university.logoDark && "dark:hidden", className)}
            />
            {university.logoDark && (
                <Image
                    src={university.logoDark}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    className={cn("hidden size-5 shrink-0 object-contain dark:block", className)}
                />
            )}
        </>
    );
}
