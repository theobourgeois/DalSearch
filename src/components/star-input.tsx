import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarInput {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function StarInput({ value, onChange, className }: StarInput) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-6 h-6 cursor-pointer transition-colors",
            hover && hover >= star
          ? "text-yellow-400 opacity-50 fill-current"
          : value >= star
          ? "text-yellow-400 fill-current"
          : "text-gray-300"
          )}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
        />
      ))}
    </div>
  );
}