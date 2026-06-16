import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { apiGet, apiPatch } from "../../lib/api";

/**
 * NotificationList — dropdown list of notifications.
 * Fetches from GET /api/notifications (max 50, sorted by createdAt desc).
 * Marks individual notifications as read on click via PATCH /api/notifications/[id]/read.
 * "Mark all as read" button calls PATCH /api/notifications/read-all.
 */
export default function NotificationList({ onClose, onNotificationsRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const result = await apiGet("/notifications");
      setNotifications(result.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notification) {
    // Mark as read
    if (!notification.isRead) {
      try {
        await apiPatch(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        onNotificationsRead?.();
      } catch {
        // Silently fail — non-critical
      }
    }

    // Navigate to the relevant entity
    navigateToEntity(notification);
    onClose?.();
  }

  async function handleMarkAllAsRead() {
    try {
      setMarkingAll(true);
      await apiPatch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onNotificationsRead?.();
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  }

  function navigateToEntity(notification) {
    const { entityType, entityId } = notification;

    if (!entityType || !entityId) return;

    switch (entityType) {
      case "project":
        navigate(`/portfolio/${entityId}`);
        break;
      case "feedback_request":
        navigate(`/feedback/${entityId}`);
        break;
      case "feedback":
        navigate(`/feedback/${entityId}`);
        break;
      case "job":
        navigate(`/jobs/${entityId}`);
        break;
      case "application":
        navigate(`/applications`);
        break;
      default:
        break;
    }
  }

  function formatTimestamp(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHr < 24) return `${diffHr} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Thông báo</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCheck className="w-3 h-3" />
            )}
            Đọc tất cả
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleMarkAsRead(notification)}
              className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                !notification.isRead ? "bg-indigo-50/50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Unread indicator */}
                <div className="pt-1.5 flex-shrink-0">
                  {!notification.isRead ? (
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm truncate ${
                      !notification.isRead
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-700"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {notification.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>

                {/* Read check */}
                {notification.isRead && (
                  <Check className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
