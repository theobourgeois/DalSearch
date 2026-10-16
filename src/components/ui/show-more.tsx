import { cn } from "@/lib/utils";
import { Button } from "./button";

/** "Show 20 more", rendered only while there are hidden items. */
export function ShowMore({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
    if (count <= 0) return null;
    return (
        <div className={cn("mt-5 flex justify-center", className)}>
            <Button onClick={onClick}>Show {count} more</Button>
        </div>
    );
}
