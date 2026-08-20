import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../context/auth_context';
import { useUser } from '../../context/UserContext';

export default function CustomDrawer(props: any) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user: authUser } = useAuth();
  const { user } = useUser();
  
  const displayName = authUser?.fullName || user.name;
  const displayPhone = authUser?.phone || user.mobile;
  const displayImage = authUser?.profilePictureUrl || user.profileImage;

  const menuItems = [
    { label: 'Dash Board', icon: 'grid-outline', route: '/(tabs)' },
    { label: 'Book a service', icon: 'calendar-outline', route: '/(tabs)/book' },
    { label: 'History', icon: 'time-outline', route: '/(tabs)/history' },
    { label: 'Support', icon: 'headset-outline', route: '/support' },
    { label: 'Settings', icon: 'settings-outline', route: '/settings' },
    { label: 'About Us', icon: 'information-circle-outline', route: '/about' },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const navigateTo = (route: string) => {
    if (route === '/(tabs)') {
      router.replace('/(tabs)');
    } else {
      router.push(route as any);
    }
    props.navigation.closeDrawer();
  };

  return (
    <View style={styles.container}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="person" size={50} color="#6B7280" />
          </View>
        )}
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userPhone}>{displayPhone}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigateTo('/profile')}
        >
          <Ionicons name="create-outline" size={14} color="#000" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const isActive = pathname === item.route || (item.route === '/(tabs)' && pathname === '/');
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => navigateTo(item.route)}
            >
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={isActive ? '#E84E0F' : '#374151'} 
              />
              <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout at Bottom */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#E84E0F" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  profileSection: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    color: '#000',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeMenuItem: {
    backgroundColor: '#FFF7ED',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 16,
  },
  activeMenuLabel: {
    color: '#E84E0F',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 16,
  },
});
