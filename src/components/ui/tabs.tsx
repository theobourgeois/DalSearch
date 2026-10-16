"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn("flex gap-7 overflow-x-auto border-b border-line [scrollbar-width:none]", className)}
        {...props}
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

type TabsTriggerProps = React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    count?: number;
};

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
    ({ className, children, count, ...props }, ref) => (
        <TabsPrimitive.Trigger
            ref={ref}
            className={cn(
                "relative shrink-0 pb-3 text-[15px] font-bold text-fg-subtle transition-colors hover:text-fg-muted focus-visible:outline-none focus-visible:text-fg",
                "data-[state=active]:text-fg data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[3px] data-[state=active]:after:rounded-full data-[state=active]:after:bg-fg",
                className,
            )}
            {...props}
        >
            {children}
            {count !== undefined && <span className="ml-1.5 font-medium">{count}</span>}
        </TabsPrimitive.Trigger>
    ),
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn("focus-visible:outline-none", className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
