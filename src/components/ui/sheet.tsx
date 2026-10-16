"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { focusRing } from "./styles";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetContent = React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
            ref={ref}
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex h-full w-[min(20rem,85vw)] flex-col bg-canvas shadow-2xl transition ease-in-out",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left data-[state=closed]:duration-200 data-[state=open]:duration-300",
                className,
            )}
            {...props}
        >
            {children}
            <SheetPrimitive.Close
                className={cn(
                    "absolute right-3 top-4 grid size-8 place-items-center rounded-full text-fg-muted hover:bg-raised hover:text-fg",
                    focusRing,
                )}
            >
                <XIcon className="size-[18px]" />
                <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
        </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetTitle = SheetPrimitive.Title;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
