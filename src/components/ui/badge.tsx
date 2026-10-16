import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-bold [&_svg]:size-3.5",
    {
        variants: {
            variant: {
                neutral: "bg-raised text-fg",
                outline: "border border-line-strong text-fg",
                success: "bg-success/15 text-success",
                danger: "bg-danger/10 text-danger",
            },
        },
        defaultVariants: { variant: "neutral" },
    },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
