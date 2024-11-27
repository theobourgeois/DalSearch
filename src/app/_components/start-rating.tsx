import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  className?: string;
}

export function StarRating({ rating, className }: StarRatingProps) {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(5)].map((_, index) => {
        if (index < fullStars) {
          return <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />;
        } else if (index === fullStars && hasHalfStar) {
          return <StarHalf key={index} className="w-4 h-4 text-yellow-400 fill-current" />;
        } else {
          return <Star key={index} className="w-4 h-4 text-gray-300" />;
        }
      })}
    </div>
  );
}
