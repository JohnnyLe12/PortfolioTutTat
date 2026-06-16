import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { apiGet, getAccessToken } from "../../lib/api";
import NotificationList from "./NotificationList";

/**
 * NotificationBell — bell icon with unread count badge.
 * Fetches unread count from GET /api/notifications/unread-count.
 * Clicking toggles the NotificationList dropdown.
 */
export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch unread count on mount and periodically (every 30s)
  useEffect(() => {
    if (!getAccessToken()) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const result = await apiGet("/notifications/unread-count");
      setUnreadCount(result.data?.count || 0);
    } catch {
      // Silently fail — badge is non-critical
    }
  }

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleNotificationsRead() {
    // Refresh unread count when notifications are marked as read
    fetchUnreadCount();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationList
          onClose={() => setIsOpen(false)}
          onNotificationsRead={handleNotificationsRead}
        />
      )}
    </div>
  );
}
