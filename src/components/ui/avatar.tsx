import { cn } from "@/lib/utils";

/** "Srinivas Sampalli" -> "SS", "Sampalli S." -> "SS". */
export function initials(name: string): string {
    const letters = name.match(/\b[A-Za-zÀ-ÿ]/g) ?? [];
    return letters.slice(0, 2).join("").toUpperCase();
}

type AvatarProps = {
    name: string;
    imageUrl?: string;
    className?: string;
};

/** A circular avatar showing an image or the person's initials. */
export function Avatar({ name, imageUrl, className }: AvatarProps) {
    return (
        <span
            className={cn(
                "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-raised text-[12.5px] font-bold text-fg-muted",
                className,
            )}
            aria-hidden
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="size-full object-cover" />
            ) : (
                initials(name)
            )}
        </span>
    );
}
