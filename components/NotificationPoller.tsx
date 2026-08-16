import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/auth_context';
import { notificationService } from '../services/notificationService';
import Toast from 'react-native-toast-message';
import { Vibration } from 'react-native';
import { useRouter } from 'expo-router';

let triggerCheck: (() => void) | null = null;

// Module-level persistent set to prevent duplicate toasts across screen remounts
const globalShownNotificationIds = new Set<string>();

export const checkNotificationsNow = () => {
  if (triggerCheck) {
    triggerCheck();
  }
};

export default function NotificationPoller() {
  const { isAuthenticated, user } = useAuth();
  const isInitialFetch = useRef(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      isInitialFetch.current = true;
      return;
    }

    const poll = async () => {
      try {
        const notifications = await notificationService.getNotifications();

        // Find unread notifications
        const unread = notifications.filter(n => !n.isRead);

        const parseNotificationTime = (dateStr: string) => {
          if (!dateStr) return 0;
          const formatted = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
          const time = new Date(formatted).getTime();
          return isNaN(time) ? new Date(dateStr).getTime() : time;
        };

        if (isInitialFetch.current) {
          // On app launch, record all existing unread notification IDs so old notifications never pop up Toasts repeatedly
          unread.forEach(n => {
            globalShownNotificationIds.add(n.id);
          });
          isInitialFetch.current = false;
          return;
        }

        // Show Toast ONCE for any unread notification arriving in real-time or recently created
        unread.forEach(n => {
          if (!globalShownNotificationIds.has(n.id)) {
            globalShownNotificationIds.add(n.id);

            try {
              Vibration.vibrate();
            } catch (e) {
              // Ignore vibration error
            }

            const rawType = (n.type || '').toLowerCase();
            const toastType = ['success', 'error', 'warning', 'info'].includes(rawType) ? rawType : 'info';

            Toast.show({
              type: toastType,
              text1: n.title,
              text2: n.message,
              position: 'top',
              visibilityTime: 6000,
              onPress: () => {
                Toast.hide();
                const target = n.targetUrl === '/bookings' ? '/(tabs)/history' : (n.targetUrl || '/notifications');
                router.push(target as any);
              }
            });
          }
        });
      } catch (error: any) {
        if (error?.message === 'SESSION_EXPIRED') {
          return;
        }
        console.log('Error polling notifications:', error);
      }
    };

    triggerCheck = poll;

    // Initial check immediately on mount
    poll();

    // Poll every 4 seconds for instant real-time updates
    const intervalId = setInterval(poll, 4000);

    return () => {
      triggerCheck = null;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user]);

  return null;
}
