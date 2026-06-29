import { request } from './api';

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  recipientId: string;
  targetUrl?: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationDTO[]> => {
    return request<NotificationDTO[]>('/notifications');
  },

  markAsRead: async (id: string): Promise<NotificationDTO> => {
    return request<NotificationDTO>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async (): Promise<void> => {
    return request<void>('/notifications/read-all', {
      method: 'POST',
    });
  },

  deleteNotification: async (id: string): Promise<void> => {
    return request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
};
