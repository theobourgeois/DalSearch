import * as React from "react";
import { cn } from "@/lib/utils";

type DataListProps = React.HTMLAttributes<HTMLDivElement> & {
    /** CSS grid columns used from the md breakpoint up. */
    columns: string;
    /** CSS grid columns used on small screens. */
    mobileColumns?: string;
};

/** A list laid out like a table: the header and rows share one grid template. The header is visual only. */
export function DataList({ columns, mobileColumns = "minmax(0,1fr) auto", style, className, ...props }: DataListProps) {
    return (
        <div
            className={cn("flex flex-col", className)}
            style={{ "--columns": columns, "--columns-sm": mobileColumns, ...style } as React.CSSProperties}
            {...props}
        />
    );
}

const rowGrid =
    "grid items-center gap-x-4 px-4 [grid-template-columns:var(--columns-sm)] md:gap-x-[18px] md:[grid-template-columns:var(--columns)]";

export function DataListHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            aria-hidden
            className={cn(
                rowGrid,
                "mb-1.5 hidden h-9 border-b border-line text-[13px] font-medium text-fg-subtle md:grid",
                className,
            )}
            {...props}
        />
    );
}

type DataListRowProps = React.HTMLAttributes<HTMLDivElement> & { highlighted?: boolean };

export function DataListRow({ className, highlighted, ...props }: DataListRowProps) {
    return (
        <div
            className={cn(
                rowGrid,
                "group min-h-16 rounded-row py-3 text-sm text-fg-muted transition-colors hover:bg-raised md:py-2",
                highlighted && "bg-raised",
                className,
            )}
            {...props}
        />
    );
}

/** Two stacked lines inside a list cell: a strong primary line and a muted secondary line. */
export function CellText({
    primary,
    secondary,
    className,
}: {
    primary: React.ReactNode;
    secondary?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("min-w-0", className)}>
            <div className="truncate font-bold text-fg">{primary}</div>
            {secondary && <div className="mt-0.5 truncate text-[13px] text-fg-subtle">{secondary}</div>}
        </div>
    );
}
