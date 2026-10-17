import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useHref } from "@/components/university";

/** The site's mark: a magnifying glass in the university's accent colour. */
export function LogoMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 753 768" className={cn("size-6", className)} aria-hidden>
            <path
                className="fill-accent"
                d="M735.53,705.37l-166.07-169.66c44.79-55.69,71.54-127.02,71.54-204.64,0-178.41-141.72-323.07-316.5-323.07S8,152.66,8,331.07s141.72,323.07,316.5,323.07c76.35,0,146.38-27.61,201.08-73.63l166.07,169.51c19.39,18.1,37.57,6.44,43.88,0,12.62-12.73,12.62-31.91,0-44.64ZM69.77,331.07c0-143.59,114.07-260.02,254.73-260.02s254.88,116.43,254.88,260.02-114.07,260.02-254.73,260.02S69.77,474.66,69.77,331.07Z"
            />
        </svg>
    );
}

export function Logo({ className }: { className?: string }) {
    const pagePath = useHref();
    return (
        <Link href={pagePath("/")} className={cn("flex items-center gap-2.5 rounded-full", className)}>
            <LogoMark />
            <span className="text-[17px] font-black tracking-tight">{SITE_NAME}</span>
        </Link>
    );
}
