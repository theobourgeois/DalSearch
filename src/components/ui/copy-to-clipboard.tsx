import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CopyToClipboardProps {
    text: string;
    className?: string;
    iconClassName?: string;
}

export function CopyToClipboard({
    text,
    className,
    iconClassName,
}: CopyToClipboardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            onClick={handleCopy}
            className={cn("hover:cursor-pointer inline-flex", className)}
        >
            {copied ? (
                <Check
                    className={cn("h-4 w-4 text-green-500", iconClassName)}
                />
            ) : (
                <Copy
                    className={cn(
                        "h-4 w-4 hover:text-yellow-400",
                        iconClassName
                    )}
                />
            )}
        </div>
    );
}
