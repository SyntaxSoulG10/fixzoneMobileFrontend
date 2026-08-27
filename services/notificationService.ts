import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { request } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error('EAS project ID not found');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F97316',
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo Push Token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error fetching Expo Push Token:', error);
    return null;
  }
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isArchived?: boolean;
  createdAt: string;
  recipientId: string;
  targetUrl?: string;
}

export const notificationService = {
  registerForPushNotifications: registerForPushNotificationsAsync,

  getNotifications: async (): Promise<NotificationDTO[]> => {
    return request<NotificationDTO[]>('/notifications');
  },

  getArchivedNotifications: async (): Promise<NotificationDTO[]> => {
    return request<NotificationDTO[]>('/notifications/archived');
  },

  archiveNotification: async (id: string): Promise<NotificationDTO> => {
    return request<NotificationDTO>(`/notifications/${id}/archive`, {
      method: 'PATCH',
    });
  },

  unarchiveNotification: async (id: string): Promise<NotificationDTO> => {
    return request<NotificationDTO>(`/notifications/${id}/unarchive`, {
      method: 'PATCH',
    });
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
  },

  savePushToken: async (pushToken: string): Promise<void> => {
    return request<void>('/mobile/notifications/register-token', {
      method: 'POST',
      body: JSON.stringify({
        token: pushToken,
        platform: Platform.OS,
      }),
    });
  },
};
