import { cn } from "@/lib/utils";

/** A list of label/value rows, like the details column on the course page. */
export function PropertyList({ className, ...props }: React.HTMLAttributes<HTMLDListElement>) {
    return <dl className={cn("flex flex-col", className)} {...props} />;
}

export function Property({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[7.25rem_1fr] items-start gap-3 py-1.5 text-sm">
            <dt className="font-medium text-fg-subtle">{label}</dt>
            <dd className="font-medium leading-relaxed text-fg">{children}</dd>
        </div>
    );
}
