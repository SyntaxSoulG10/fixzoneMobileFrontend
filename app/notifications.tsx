import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenContainer from '../components/ui/ScreenContainer';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'service' | 'promo' | 'alert';
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Service Reminder',
    message: 'Your Honda Civic service is due in 3 days. Book your slot now to avoid delays.',
    time: '2 hours ago',
    type: 'service',
    read: false,
  },
  {
    id: '2',
    title: 'Exclusive Offer!',
    message: 'Get 20% off on all interior detailing services this weekend only.',
    time: '5 hours ago',
    type: 'promo',
    read: false,
  },
  {
    id: '3',
    title: 'Booking Confirmed',
    message: 'Your booking for Toyota Corolla at Hybrid Hub has been successfully confirmed.',
    time: 'Yesterday',
    type: 'service',
    read: true,
  },
  {
    id: '4',
    title: 'New Service Center',
    message: 'FixAuto Professionals is now open in Colombo 07. Check out their services.',
    time: '2 days ago',
    type: 'promo',
    read: true,
  },
  {
    id: '5',
    title: 'Security Alert',
    message: 'A new login was detected from a Chrome browser on Windows.',
    time: '3 days ago',
    type: 'alert',
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'service': return { name: 'construct', color: '#3B82F6', bg: '#EFF6FF' };
      case 'promo': return { name: 'megaphone', color: '#E84E0F', bg: '#FFF7ED' };
      case 'alert': return { name: 'alert-circle', color: '#EF4444', bg: '#FEF2F2' };
      default: return { name: 'notifications', color: '#6B7280', bg: '#F3F4F6' };
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    markAsRead(id);
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.headerSide} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const iconData = getIcon(notif.type);
            return (
              <TouchableOpacity 
                key={notif.id} 
                style={[styles.notifCard, !notif.read && styles.unreadCard]}
                onPress={() => toggleExpand(notif.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconData.bg }]}>
                  <Ionicons name={iconData.name as any} size={22} color={iconData.color} />
                </View>
                
                <View style={styles.notifContent}>
                  <Text 
                    style={[styles.notifTitle, !notif.read && styles.unreadTitle]} 
                    numberOfLines={1}
                  >
                    {notif.title}
                  </Text>
                  
                  <Text 
                    style={styles.notifMessage}
                    numberOfLines={expandedIds.includes(notif.id) ? undefined : 2}
                  >
                    {notif.message}
                  </Text>
                  
                  <View style={styles.notifFooter}>
                    {notif.message.length > 60 && (
                      <Text style={styles.seeMoreText}>
                        {expandedIds.includes(notif.id) ? 'See Less' : 'See More'}
                      </Text>
                    )}
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                </View>

                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={60} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You don&apos;t have any notifications right now.</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: -2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '800',
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginLeft: 'auto', // Pushes to right if no see more text
  },
  notifMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  seeMoreText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '600',
  },
});
