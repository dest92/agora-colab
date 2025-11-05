/**
 * Notifications Panel Component
 * Displays real-time notifications including workspace invitations
 */

"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check, Users, MessageSquare, CheckCheck } from "lucide-react";
import {
  notificationsApi,
  type Notification,
} from "@/app/_lib/api/notifications";
import { socketClient } from "@/app/_lib/api";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({
  isOpen,
  onClose,
}: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications on open
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Listen for real-time notification events
  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    const handleNewNotification = (payload: Notification) => {
      console.log("New notification received:", payload);

      // Add to list if not already present
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === payload.id);
        if (exists) return prev;
        return [payload, ...prev];
      });

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission granted
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(payload.title, {
          body: payload.body,
          icon: "/favicon.ico",
        });
      }
    };

    socket.on("notification:created", handleNewNotification);

    return () => {
      socket.off("notification:created", handleNewNotification);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        notificationsApi.listNotifications(50),
        notificationsApi.countUnread(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "workspace_invitation":
        return <Users className="w-5 h-5 text-blue-400" />;
      case "comment":
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#333333] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333333]">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#00AFF0]" />
            <h2 className="text-lg font-bold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-[#00AFF0] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#00AFF0] hover:text-[#0099d9] transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#999999] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-[#00AFF0]/30 border-t-[#00AFF0] rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Bell className="w-12 h-12 text-[#333333] mb-2" />
              <p className="text-white/60">No notifications yet</p>
              <p className="text-xs text-white/40 mt-1">
                You'll be notified about workspace invitations and activity
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#333333]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors ${
                    notification.readAt
                      ? "bg-transparent"
                      : "bg-[#00AFF0]/5 hover:bg-[#00AFF0]/10"
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">
                          {notification.title}
                        </h3>
                        {!notification.readAt && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-[#00AFF0] hover:text-[#0099d9] transition-colors shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#999999] mb-2">
                        {notification.body}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#666666]">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        {notification.type === "workspace_invitation" &&
                          notification.workspaceName && (
                            <a
                              href="/dashboard"
                              className="text-xs text-[#00AFF0] hover:text-[#0099d9] font-medium transition-colors"
                            >
                              View workspace →
                            </a>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
