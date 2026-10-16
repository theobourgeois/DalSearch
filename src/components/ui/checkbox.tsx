"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer grid size-[18px] shrink-0 place-items-center rounded-md border-[1.5px] border-fg-subtle transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:border-fg data-[state=checked]:bg-fg data-[state=checked]:text-panel",
            focusRing,
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator>
            <CheckIcon weight="bold" className="size-3" />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
