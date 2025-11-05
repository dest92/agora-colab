"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  notificationsApi,
  socketClient,
  type Notification,
  type DomainEventPayload,
} from "@/app/_lib/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Poll for new notifications every 30 seconds (backup mechanism)
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    // Listen for real-time notifications
    const handleNotificationCreated = (payload: unknown) => {
      console.log("New notification received:", payload);

      // Cast payload to Notification type
      const notification = payload as Notification;

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.body,
          icon: "/logo.png",
        });
      }
    };

    socketClient.on("notification:created", handleNotificationCreated);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      clearInterval(interval);
      socketClient.off("notification:created", handleNotificationCreated);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.listNotifications(20);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.countUnread();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      // Update local state
      setNotifications(
        notifications.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return "💬";
      case "workspace_invitation":
        return "🤝";
      case "invite":
        return "📨";
      case "assignment":
        return "📌";
      case "vote":
        return "👍";
      default:
        return "🔔";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] hover:bg-[#00AFF0] transition-colors flex items-center justify-center group"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#E3008C] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#1a1a1a] border-2 border-[#333333] shadow-lg z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 bg-[#2d2d2d] border-b-2 border-[#333333] flex items-center justify-between">
            <h3 className="text-white font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-[#00AFF0] hover:text-white transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#00AFF0]/30 border-t-[#00AFF0] rounded-full animate-spin mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#333333] hover:bg-[#2d2d2d] transition-colors ${
                    !notification.readAt ? "bg-[#00AFF0]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-white font-medium text-sm">
                          {notification.title}
                        </h4>
                        {!notification.readAt && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-[#00AFF0] hover:text-white transition-colors shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-white/70 text-xs mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-white/40 text-xs mt-1 block">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
