import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./styles";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={cn(fieldBase, "min-h-[120px] rounded-card px-4 py-3 text-[15px] leading-relaxed", className)}
            {...props}
        />
    ),
);
Textarea.displayName = "Textarea";

export { Textarea };
