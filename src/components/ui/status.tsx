import { cn } from "@/lib/utils";

export type StatusTone = "success" | "danger" | "neutral";

const toneStyles: Record<StatusTone, { dot: string; label: string }> = {
    success: { dot: "bg-success", label: "text-fg" },
    danger: { dot: "bg-danger", label: "text-danger" },
    neutral: { dot: "bg-fg-subtle", label: "text-fg-muted font-medium" },
};

type StatusProps = {
    tone?: StatusTone;
    label: React.ReactNode;
    detail?: React.ReactNode;
    /** Overrides the dot colour, e.g. with a course colour. */
    color?: string;
    className?: string;
};

/** A coloured dot with a label and an optional secondary line. */
export function Status({ tone = "neutral", label, detail, color, className }: StatusProps) {
    const styles = toneStyles[tone];
    return (
        <div className={cn("min-w-0", className)}>
            <div className={cn("flex items-center gap-2 text-sm font-bold", styles.label)}>
                <span
                    className={cn("size-2 shrink-0 rounded-full", !color && styles.dot)}
                    style={color ? { backgroundColor: color } : undefined}
                />
                <span className="truncate">{label}</span>
            </div>
            {detail && <div className="mt-0.5 truncate pl-4 text-[13px] text-fg-subtle">{detail}</div>}
        </div>
    );
}

/** A small coloured dot, e.g. for a course colour. */
export function Dot({ color, className }: { color: string; className?: string }) {
    return <span className={cn("size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}
