"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  onRatingChange,
  readonly = false,
  size = "md",
  className
}: StarRatingProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onRatingChange?.(starValue)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform",
              isActive ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground fill-transparent"
            )}
          >
            <Star className={sizes[size]} />
          </button>
        );
      })}
    </div>
  );
}
