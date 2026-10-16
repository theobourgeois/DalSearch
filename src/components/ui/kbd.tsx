import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
        <kbd
            className={cn(
                "inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-line-strong px-2 font-sans text-xs font-medium text-fg-subtle",
                className,
            )}
            {...props}
        />
    );
}
