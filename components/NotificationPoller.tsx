import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/auth_context';
import { notificationService } from '../services/notificationService';
import Toast from 'react-native-toast-message';
import { Vibration } from 'react-native';

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
        
        if (isInitialFetch.current) {
          // On initial app launch, silently mark past notifications (> 2 min old) as shown
          const now = Date.now();
          unread.forEach(n => {
            const createdTime = new Date(n.createdAt).getTime();
            if ((now - createdTime) > 2 * 60 * 1000) {
              globalShownNotificationIds.add(n.id);
            }
          });
          isInitialFetch.current = false;
        }

        // Show Toast ONCE for any new unread notification
        unread.forEach(n => {
          if (!globalShownNotificationIds.has(n.id)) {
            globalShownNotificationIds.add(n.id);
            
            try {
              Vibration.vibrate();
            } catch (e) {
              // Ignore vibration error
            }
            
            Toast.show({
              type: 'info',
              text1: n.title,
              text2: n.message,
              position: 'top',
              visibilityTime: 6000,
            });
          }
        });
      } catch (error) {
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
