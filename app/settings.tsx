import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { getNotificationPopupEnabled, setNotificationPopupEnabled } from '../utils/notification_settings';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
}

const SettingItem = ({ icon, label, subtitle, onPress, isLast, rightElement }: SettingItemProps) => (
  <TouchableOpacity 
    style={[styles.settingItem, !isLast && styles.borderBottom]} 
    onPress={onPress}
    disabled={!onPress && !rightElement}
  >
    <View style={styles.itemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color="#E84E0F" />
      </View>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {rightElement ? rightElement : <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />}
  </TouchableOpacity>
);

const SettingSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

interface SettingItemData {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  route?: string;
  isToggle?: boolean;
}

interface SettingSectionData {
  id: string;
  title: string;
  items: SettingItemData[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [popupEnabled, setPopupEnabled] = useState(true);

  useEffect(() => {
    getNotificationPopupEnabled().then(enabled => {
      setPopupEnabled(enabled);
    });
  }, []);

  const handleTogglePopup = async (val: boolean) => {
    setPopupEnabled(val);
    await setNotificationPopupEnabled(val);
  };

  const settingSections: SettingSectionData[] = [
    {
      id: 'account',
      title: 'Account Settings',
      items: [
        { id: 'profile-edit', icon: 'person-outline', label: 'Profile Edit', route: '/profile' },
        { id: 'password', icon: 'lock-closed-outline', label: 'Change Password', route: '/change-password' },
      ],
    },
    {
      id: 'notifications',
      title: 'Notification Preference',
      items: [
        { id: 'push-notif', icon: 'notifications-outline', label: 'Push Notification', route: '/notifications' },
        { 
          id: 'notif-popup', 
          icon: 'chatbox-ellipses-outline', 
          label: 'Notification Pop-up', 
          subtitle: 'Show banner alerts & vibration on screen',
          isToggle: true 
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      items: [
        { id: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacy Policy', route: '/privacy' },
        { id: 'business-policy', icon: 'briefcase-outline', label: 'Business Policy', route: '/business-policy' },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        { id: 'language', icon: 'globe-outline', label: 'Language' },
      ],
    },
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return settingSections;
    const query = searchQuery.toLowerCase().trim();

    return settingSections.map(section => {
      const sectionTitleMatches = section.title.toLowerCase().includes(query);
      const matchingItems = section.items.filter(
        item => sectionTitleMatches || item.label.toLowerCase().includes(query)
      );

      return {
        ...section,
        items: matchingItems,
      };
    }).filter(section => section.items.length > 0);
  }, [searchQuery, settingSections]);

  const handleItemPress = (item: SettingItemData) => {
    if (item.id === 'language') {
      Alert.alert(
        'Language Updates',
        'New language updates are coming in the next update soon! Stay tuned. 🌐',
        [{ text: 'OK' }]
      );
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search Settings...." 
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtered Sections */}
        {filteredSections.length > 0 ? (
          filteredSections.map(section => (
            <SettingSection key={section.id} title={section.title}>
              {section.items.map((item, index) => (
                <SettingItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  subtitle={item.subtitle}
                  isLast={index === section.items.length - 1}
                  onPress={item.isToggle ? () => handleTogglePopup(!popupEnabled) : () => handleItemPress(item)}
                  rightElement={
                    item.isToggle ? (
                      <Switch
                        value={popupEnabled}
                        onValueChange={handleTogglePopup}
                        trackColor={{ false: '#E5E7EB', true: '#FFEDD5' }}
                        thumbColor={popupEnabled ? '#E84E0F' : '#9CA3AF'}
                      />
                    ) : undefined
                  }
                />
              ))}
            </SettingSection>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No settings found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn&apos;t find any setting matching &quot;{searchQuery}&quot;
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E84E0F',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
