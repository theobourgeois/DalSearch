"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
    const { resolvedTheme } = useTheme();

    return (
        <Sonner
            theme={resolvedTheme as ToasterProps["theme"]}
            position="bottom-center"
            toastOptions={{
                classNames: {
                    toast: "!rounded-full !border-line !bg-fg !text-panel !font-sans !font-bold !shadow-xl",
                    description: "!text-panel/70 !font-medium",
                    actionButton: "!rounded-full !bg-accent !text-accent-fg !font-bold",
                },
            }}
            {...props}
        />
    );
}
