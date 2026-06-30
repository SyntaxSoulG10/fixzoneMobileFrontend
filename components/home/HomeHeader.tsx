import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { MOCK_USER } from '../../constants/mock_data';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import { useRouter, useFocusEffect } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/auth_context';
import { notificationService } from '../../services/notificationService';

export default function HomeHeader() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const router = useRouter();
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchUnreadStatus = async () => {
        try {
          const notifications = await notificationService.getNotifications();
          const unread = notifications.some(n => !n.isRead);
          setHasUnread(unread);
        } catch (error) {
          console.log('Error fetching notifications for header:', error);
        }
      };
      fetchUnreadStatus();
    }, [])
  );

  const fullName = authUser?.fullName || user.name;
  const nameParts = fullName.trim().split(/\s+/);
  const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={styles.brandText}>Fix Zone</Text>
          <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">Welcome {lastName} !</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
          <View style={styles.avatarBorder}>
            {(authUser?.profilePictureUrl || user.profileImage) ? (
              <Image
                source={{ uri: authUser?.profilePictureUrl || user.profileImage || '' }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={28} color="#000" />
          {hasUnread && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 16,
  },
  brandText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    marginRight: 16,
  },
  avatarBorder: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBtn: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  }
});
