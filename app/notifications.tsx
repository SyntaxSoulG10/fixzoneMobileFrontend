import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '../constants/colors';
import { notificationService, NotificationDTO } from '../services/notificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications();
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(sorted);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (notif: NotificationDTO) => {
    const title = (notif.title || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();

    if (title.includes('payment') || title.includes('paid')) {
      return { name: 'checkmark-circle', color: '#F97316', bg: '#FFF7ED' };
    }
    if (title.includes('booking') || title.includes('rescheduled') || type === 'booking') {
      return { name: 'calendar', color: '#3B82F6', bg: '#EFF6FF' };
    }
    if (title.includes('account') || title.includes('activated') || title.includes('completed')) {
      return { name: 'checkmark-circle', color: '#22C55E', bg: '#F0FDF4' };
    }
    if (type === 'alert' || title.includes('cancel') || title.includes('warning')) {
      return { name: 'alert-circle', color: '#EF4444', bg: '#FEF2F2' };
    }
    return { name: 'notifications', color: '#6366F1', bg: '#EEF2FF' };
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || notif.isRead) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    markAsRead(id);
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const todayNotifs = notifications.filter(n => isToday(n.createdAt));
  const earlierNotifs = notifications.filter(n => !isToday(n.createdAt));

  const renderCard = (notif: NotificationDTO) => {
    const iconData = getIcon(notif);
    const isRead = notif.isRead;
    const isExpanded = expandedIds.includes(notif.id);
    const dateObj = new Date(notif.createdAt);
    const displayDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;

    return (
      <TouchableOpacity 
        key={notif.id} 
        style={styles.notifCard}
        onPress={() => toggleExpand(notif.id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeaderRow}>
          <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
            <Ionicons name={iconData.name as any} size={22} color={iconData.color} />
          </View>
          
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {notif.title}
            </Text>
            
            <Text 
              style={styles.notifMessage}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {notif.message}
            </Text>

            <View style={styles.notifFooter}>
              <Text style={styles.seeMoreText}>
                {isExpanded ? 'See Less' : 'See More'}
              </Text>
              <Text style={styles.notifTime}>{displayDate}</Text>
            </View>
          </View>

          {!isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.markReadButton} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done" size={24} color="#E84E0F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color="#E84E0F" style={{ marginTop: 40 }} />
        ) : notifications.length > 0 ? (
          <>
            {todayNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>TODAY</Text>
                {todayNotifs.map(renderCard)}
              </View>
            )}

            {earlierNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>EARLIER</Text>
                {earlierNotifs.map(renderCard)}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You don't have any notifications right now.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  markReadButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
    paddingRight: 12,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    fontWeight: '400',
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  seeMoreText: {
    fontSize: 13,
    color: '#E84E0F',
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E84E0F',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500',
  },
});
