import { Star } from "lucide-react";

/**
 * StarRating — Display-only component showing 1-5 filled/unfilled stars.
 *
 * Props:
 * - rating: number (1-5) — the star rating to display
 * - size: number (optional) — icon size in pixels, default 16
 */
export default function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
}
