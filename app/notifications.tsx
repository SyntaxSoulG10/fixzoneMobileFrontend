import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator, 
  Animated, 
  PanResponder 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { notificationService, NotificationDTO } from '../services/notificationService';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SwipeableCardProps {
  notif: NotificationDTO;
  isExpanded: boolean;
  isArchivedTab: boolean;
  onToggleExpand: () => void;
  onMarkAsRead: () => void;
  onArchiveOrRestore: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (notif: NotificationDTO) => { name: string; color: string; bg: string };
  formatNotifTime: (dateStr: string) => string;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  notif,
  isExpanded,
  isArchivedTab,
  onToggleExpand,
  onMarkAsRead,
  onArchiveOrRestore,
  onDelete,
  getIcon,
  formatNotifTime
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const iconData = getIcon(notif);
  const isRead = notif.isRead;
  const displayTime = formatNotifTime(notif.createdAt);
  const isLongMessage = (notif.message || '').length > 50;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100) {
          // Swiped Right -> Archive or Restore
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onArchiveOrRestore(notif.id);
          });
        } else if (gestureState.dx < -100) {
          // Swiped Left -> Delete
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(notif.id);
          });
        } else {
          // Spring back
          Animated.spring(translateX, {
            toValue: 0,
            bounciness: 10,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Background Actions */}
      <View style={styles.actionBackground}>
        {/* Left Background (Gray -> Archive / Restore) */}
        <View style={styles.leftAction}>
          <Ionicons name={isArchivedTab ? "refresh-outline" : "archive-outline"} size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>{isArchivedTab ? "Restore" : "Archive"}</Text>
        </View>

        {/* Right Background (Gray -> Delete) */}
        <View style={styles.rightAction}>
          <Text style={styles.actionText}>Delete</Text>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* Foreground Card */}
      <Animated.View
        style={[
          styles.notifCard,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => (isLongMessage ? onToggleExpand() : onMarkAsRead())}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
              <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
            </View>

            <View style={styles.notifContent}>
              <Text style={styles.notifTitle} numberOfLines={1}>
                {notif.title}
              </Text>

              <Text
                style={styles.notifMessage}
                numberOfLines={isExpanded ? undefined : 1}
              >
                {notif.message}
              </Text>

              <View style={styles.notifFooter}>
                {isLongMessage ? (
                  <Text style={styles.seeMoreText}>
                    {isExpanded ? 'See Less' : 'See More'}
                  </Text>
                ) : (
                  <View />
                )}
                <Text style={styles.notifTime}>{displayTime}</Text>
              </View>
            </View>

            {!isRead && !isArchivedTab && <View style={styles.unreadDot} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');
  const [inboxNotifs, setInboxNotifs] = useState<NotificationDTO[]>([]);
  const [archivedNotifs, setArchivedNotifs] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      setExpandedIds([]);
      fetchNotifications();
    }, [activeTab])
  );

  const parseDate = (dateStr: string) => {
    if (!dateStr) return 0;
    const isoStr = dateStr.replace(' ', 'T');
    const time = new Date(isoStr).getTime();
    if (!isNaN(time)) return time;
    const fallback = new Date(dateStr).getTime();
    return isNaN(fallback) ? 0 : fallback;
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [inboxData, archivedData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getArchivedNotifications()
      ]);
      
      const uniqueInboxMap = new Map<string, NotificationDTO>();
      (inboxData || []).forEach(item => {
        if (item && item.id) uniqueInboxMap.set(item.id, item);
      });
      const sortedInbox = Array.from(uniqueInboxMap.values()).sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

      const uniqueArchivedMap = new Map<string, NotificationDTO>();
      (archivedData || []).forEach(item => {
        if (item && item.id) uniqueArchivedMap.set(item.id, item);
      });
      const sortedArchived = Array.from(uniqueArchivedMap.values()).sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));

      setInboxNotifs(sortedInbox);
      setArchivedNotifs(sortedArchived);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (notif: NotificationDTO) => {
    const title = (notif.title || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();

    if (title.includes('service started') || title.includes('in progress') || title.includes('work started')) {
      return { name: 'build', color: '#3B82F6', bg: '#EFF6FF' };
    }
    if (title.includes('service completed') || title.includes('completed')) {
      return { name: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' };
    }
    if (title.includes('payment') || title.includes('paid')) {
      return { name: 'card', color: '#F97316', bg: '#FFF7ED' };
    }
    if (title.includes('booking') || title.includes('rescheduled') || type === 'booking') {
      return { name: 'calendar', color: '#6366F1', bg: '#EEF2FF' };
    }
    if (type === 'alert' || title.includes('cancel') || title.includes('warning')) {
      return { name: 'alert-circle', color: '#EF4444', bg: '#FEF2F2' };
    }
    return { name: 'notifications', color: '#6366F1', bg: '#EEF2FF' };
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setInboxNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = inboxNotifs.find(n => n.id === id);
    if (!notif || notif.isRead) return;
    try {
      await notificationService.markAsRead(id);
      setInboxNotifs(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (activeTab === 'inbox') {
      markAsRead(id);
    }
  };

  const handleArchive = async (id: string) => {
    const target = inboxNotifs.find(n => n.id === id);
    if (!target) return;

    // Optimistic UI updates (prevent duplicates)
    setInboxNotifs(prev => prev.filter(n => n.id !== id));
    setArchivedNotifs(prev => [{ ...target, isArchived: true }, ...prev.filter(n => n.id !== id)]);
    
    Toast.show({
      type: 'success',
      text1: 'Archived',
      text2: 'Notification moved to Archive tab.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    try {
      await notificationService.archiveNotification(id);
    } catch (e) {
      console.error('Failed to sync archive with backend:', e);
    }
  };

  const handleRestore = async (id: string) => {
    const target = archivedNotifs.find(n => n.id === id);
    if (!target) return;

    // Optimistic UI updates (prevent duplicates)
    setArchivedNotifs(prev => prev.filter(n => n.id !== id));
    setInboxNotifs(prev => [{ ...target, isArchived: false }, ...prev.filter(n => n.id !== id)]);

    Toast.show({
      type: 'info',
      text1: 'Restored',
      text2: 'Notification restored to Inbox.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    try {
      await notificationService.unarchiveNotification(id);
    } catch (e) {
      console.error('Failed to sync restore with backend:', e);
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    if (activeTab === 'inbox') {
      setInboxNotifs(prev => prev.filter(n => n.id !== id));
    } else {
      setArchivedNotifs(prev => prev.filter(n => n.id !== id));
    }

    Toast.show({
      type: 'info',
      text1: 'Deleted',
      text2: 'Notification permanently removed.',
      position: 'bottom',
      visibilityTime: 2000,
    });
    try {
      await notificationService.deleteNotification(id);
    } catch (e) {
      console.error('Failed to sync notification deletion with backend:', e);
    }
  };

  const currentList = activeTab === 'inbox' ? inboxNotifs : archivedNotifs;

  const isToday = (dateStr: string) => {
    const timestamp = parseDate(dateStr);
    if (!timestamp) return false;
    const d = new Date(timestamp);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayNotifs = currentList.filter(n => isToday(n.createdAt));
  const earlierNotifs = currentList.filter(n => !isToday(n.createdAt));

  const formatNotifTime = (dateStr: string) => {
    const timestamp = parseDate(dateStr);
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {activeTab === 'inbox' ? (
          <TouchableOpacity style={styles.markReadButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={24} color="#E84E0F" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Segmented Tab Controls */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'inbox' && styles.tabButtonActive]}
          onPress={() => setActiveTab('inbox')}
        >
          <Ionicons 
            name="mail-unread-outline" 
            size={18} 
            color={activeTab === 'inbox' ? '#E84E0F' : '#64748B'} 
          />
          <Text style={[styles.tabText, activeTab === 'inbox' && styles.tabTextActive]}>
            Inbox ({inboxNotifs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'archived' && styles.tabButtonActive]}
          onPress={() => setActiveTab('archived')}
        >
          <Ionicons 
            name="archive-outline" 
            size={18} 
            color={activeTab === 'archived' ? '#E84E0F' : '#64748B'} 
          />
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
            Archived ({archivedNotifs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color="#E84E0F" style={{ marginTop: 40 }} />
        ) : currentList.length > 0 ? (
          <>
            {todayNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>TODAY</Text>
                {todayNotifs.map((notif, index) => (
                  <SwipeableCard
                    key={`${notif.id}-${index}`}
                    notif={notif}
                    isExpanded={expandedIds.includes(notif.id)}
                    isArchivedTab={activeTab === 'archived'}
                    onToggleExpand={() => toggleExpand(notif.id)}
                    onMarkAsRead={() => markAsRead(notif.id)}
                    onArchiveOrRestore={activeTab === 'inbox' ? handleArchive : handleRestore}
                    onDelete={handleDelete}
                    getIcon={getIcon}
                    formatNotifTime={formatNotifTime}
                  />
                ))}
              </View>
            )}

            {earlierNotifs.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>EARLIER</Text>
                {earlierNotifs.map((notif, index) => (
                  <SwipeableCard
                    key={`${notif.id}-${index}`}
                    notif={notif}
                    isExpanded={expandedIds.includes(notif.id)}
                    isArchivedTab={activeTab === 'archived'}
                    onToggleExpand={() => toggleExpand(notif.id)}
                    onMarkAsRead={() => markAsRead(notif.id)}
                    onArchiveOrRestore={activeTab === 'inbox' ? handleArchive : handleRestore}
                    onDelete={handleDelete}
                    getIcon={getIcon}
                    formatNotifTime={formatNotifTime}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons 
                name={activeTab === 'inbox' ? "notifications-off-outline" : "archive-outline"} 
                size={36} 
                color="#94A3B8" 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'inbox' ? "All caught up!" : "No Archived Notifications"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'inbox' 
                ? "You don't have any active notifications right now."
                : "Swipe right on any inbox notification to move it to archive."}
            </Text>
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
    paddingBottom: 12,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#E84E0F',
    fontWeight: '700',
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
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  swipeContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  actionBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  leftAction: {
    flex: 1,
    backgroundColor: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    height: '100%',
    gap: 6,
  },
  rightAction: {
    flex: 1,
    backgroundColor: '#475569',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
    height: '100%',
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifContent: {
    flex: 1,
    paddingRight: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  notifMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    fontWeight: '400',
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  seeMoreText: {
    fontSize: 11,
    color: '#E84E0F',
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E84E0F',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
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
