import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/auth_context';
import { notificationService } from '../services/notificationService';
import Toast from 'react-native-toast-message';
import { Vibration } from 'react-native';

export default function NotificationPoller() {
  const { isAuthenticated, user } = useAuth();
  const shownNotificationIds = useRef<Set<string>>(new Set());
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
          // On the very first fetch (e.g. app launch or just logged in), 
          // silently add them to the "shown" list so we don't spam popups for old unread notifications.
          unread.forEach(n => shownNotificationIds.current.add(n.id));
          isInitialFetch.current = false;
          return;
        }

        // For each unread notification, if we haven't shown it yet during this session, show a toast
        unread.forEach(n => {
          if (!shownNotificationIds.current.has(n.id)) {
            shownNotificationIds.current.add(n.id);
            
            Vibration.vibrate();
            
            Toast.show({
              type: 'info',
              text1: n.title,
              text2: n.message,
              position: 'top',
              visibilityTime: 4000,
            });
          }
        });
      } catch (error) {
        console.log('Error polling notifications:', error);
      }
    };

    // Initial check
    poll();
    
    // Poll every 15 seconds
    const intervalId = setInterval(poll, 15000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user]);

  return null;
}
