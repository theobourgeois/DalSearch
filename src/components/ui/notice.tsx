import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

type NoticeProps = {
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
};

/** A rounded warning bar, used to flag schedule clashes. */
export function Notice({ children, action, className }: NoticeProps) {
    return (
        <div
            role="status"
            className={cn(
                "flex min-h-12 items-center gap-3 rounded-[1.5rem] bg-raised py-2 pl-4 pr-2 text-sm font-medium text-fg-muted",
                className,
            )}
        >
            <WarningCircleIcon weight="fill" className="size-5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1 [&_b]:font-bold [&_b]:text-fg">{children}</div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
