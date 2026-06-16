import { useNavigate } from "react-router-dom";
import { Eye, Heart } from "lucide-react";
import StatusBadge from "./StatusBadge";

/**
 * ProjectCard — displays a project thumbnail, title, status badge, and view/like counts.
 *
 * Props:
 * - id: string
 * - title: string
 * - thumbnailUrl?: string (first media item url, or null)
 * - status: 'draft' | 'public' | 'pending_feedback'
 * - viewCount: number
 * - likeCount: number
 * - tags: string[]
 * - onClick?: () => void
 */
export default function ProjectCard({
  id,
  title,
  thumbnailUrl,
  status,
  viewCount,
  likeCount,
  tags = [],
  onClick,
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (onClick) {
      onClick();
    } else {
      navigate(`/portfolio/${id}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`View project: ${title}`}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl">🎨</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{title}</h3>
          <StatusBadge status={status} />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {viewCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {likeCount}
          </span>
        </div>
      </div>
    </div>
  );
}
