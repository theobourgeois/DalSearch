import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./styles";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, "h-11 rounded-full px-4 text-[15px]", className)} {...props} />
));
Input.displayName = "Input";

export { Input };
