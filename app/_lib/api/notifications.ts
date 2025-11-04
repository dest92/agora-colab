/**
 * Notifications API
 * Service: Notifications Service (via API Gateway)
 * Base: /notifications
 */

import { apiClient } from "./client";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

class NotificationsApi {
  /**
   * List notifications for current user
   * GET /notifications
   */
  async listNotifications(limit: number = 50): Promise<Notification[]> {
    return apiClient.get<Notification[]>(`/notifications?limit=${limit}`);
  }

  /**
   * Count unread notifications
   * GET /notifications/unread/count
   */
  async countUnread(): Promise<number> {
    const response = await apiClient.get<number>("/notifications/unread/count");
    return response;
  }

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>(
      `/notifications/${notificationId}/read`
    );
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  async markAllAsRead(): Promise<{ success: boolean }> {
    return apiClient.patch<{ success: boolean }>("/notifications/read-all");
  }
}

export const notificationsApi = new NotificationsApi();
