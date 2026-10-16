import { cn } from "@/lib/utils";

type EmptyStateProps = {
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center rounded-card bg-raised px-6 py-12 text-center", className)}>
            <p className="text-base font-bold text-fg">{title}</p>
            {description && <p className="mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
