import { useNavigate } from "react-router-dom";
import { Heart, Briefcase, Upload, MessageSquare, Bell } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Map notification type to icon and color classes.
 */
const TYPE_CONFIG = {
  project_liked: {
    icon: Heart,
    color: "bg-pink-100 text-pink-600",
  },
  application_submitted: {
    icon: Briefcase,
    color: "bg-green-100 text-green-600",
  },
  application_status: {
    icon: Briefcase,
    color: "bg-blue-100 text-blue-600",
  },
  project_created: {
    icon: Upload,
    color: "bg-purple-100 text-purple-600",
  },
  feedback_completed: {
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-600",
  },
  feedback_request_status: {
    icon: MessageSquare,
    color: "bg-indigo-100 text-indigo-600",
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  color: "bg-gray-100 text-gray-600",
};

/**
 * Map entity type to a route path for navigation.
 */
function getEntityRoute(entityType, entityId) {
  if (!entityType || !entityId) return null;

  switch (entityType) {
    case "project":
      return `/portfolio/${entityId}`;
    case "job":
      return `/jobs/${entityId}`;
    case "feedback":
    case "feedback_request":
      return `/feedback-requests`;
    case "application":
      return `/applications`;
    default:
      return null;
  }
}

/**
 * Format relative time from ISO date string.
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/**
 * RecentActivity: displays up to 10 most recent activity items.
 * Each item is clickable, navigating to the related entity page.
 *
 * Props:
 * - activities: array of notification objects from GET /api/notifications
 *   Each has: { id, type, title, body, entityType, entityId, isRead, createdAt }
 * - className: optional wrapper className
 */
export default function RecentActivity({ activities = [], className = "" }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Strictly limit to 10 items maximum
  const displayItems = activities.slice(0, 10);

  function handleClick(activity) {
    const route = getEntityRoute(activity.entityType, activity.entityId);
    if (route) {
      navigate(route);
    }
  }

  return (
    <div className={`bg-white border rounded-2xl p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-2">{t("dashboard.recentActivity")}</h2>
      <p className="text-gray-500 text-sm mb-6">{t("dashboard.recentActivity.subtitle")}</p>

      {displayItems.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">
          {t("dashboard.recentActivity.noActivity")}
        </p>
      ) : (
        <div className="space-y-4">
          {displayItems.map((activity) => {
            const config = TYPE_CONFIG[activity.type] || DEFAULT_CONFIG;
            const IconComponent = config.icon;
            const route = getEntityRoute(activity.entityType, activity.entityId);

            return (
              <div
                key={activity.id}
                className={`flex items-center gap-4 border-b pb-4 last:border-none last:pb-0 ${
                  route ? "cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors" : ""
                }`}
                onClick={() => handleClick(activity)}
                role={route ? "button" : undefined}
                tabIndex={route ? 0 : undefined}
                onKeyDown={(e) => {
                  if (route && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleClick(activity);
                  }
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.color}`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
