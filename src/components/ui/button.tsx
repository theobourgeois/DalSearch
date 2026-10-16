import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

const buttonVariants = cva(
    [
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-colors",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        focusRing,
    ],
    {
        variants: {
            variant: {
                primary: "bg-accent text-accent-fg hover:bg-accent/90",
                secondary: "bg-raised text-fg hover:bg-block",
                outline: "border border-line-strong bg-panel text-fg hover:bg-raised",
                ghost: "text-fg-muted hover:bg-raised hover:text-fg",
                danger: "bg-danger text-white hover:bg-danger/90",
                link: "text-fg-muted underline-offset-4 hover:text-fg hover:underline",
            },
            size: {
                sm: "h-8 px-3.5 text-[13px] [&_svg]:size-4",
                md: "h-10 px-4 text-sm [&_svg]:size-[18px]",
                lg: "h-12 px-6 text-[15px] [&_svg]:size-5",
                icon: "size-10 [&_svg]:size-[22px]",
                "icon-sm": "size-8 [&_svg]:size-[18px]",
            },
        },
        compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
        defaultVariants: { variant: "secondary", size: "md" },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
        const Component = asChild ? Slot : "button";
        return (
            <Component
                ref={ref}
                type={asChild ? undefined : type}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
