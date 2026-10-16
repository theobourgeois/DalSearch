"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Button, type ButtonProps } from "./button";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
    text: string;
};

/** Copies `text` to the clipboard and briefly confirms it. */
export function CopyButton({ text, children, ...props }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Button onClick={copy} {...props}>
            {copied ? <CheckIcon weight="bold" /> : <CopyIcon />}
            {copied ? "Copied" : children}
        </Button>
    );
}
