import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { MOCK_USER } from '../../constants/mock_data';

import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';

export default function HomeHeader() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const router = useRouter();
  const { user } = useUser();

  return (
    <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-white">
      <View className="flex-row items-center">
        <TouchableOpacity className="mr-4" onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text className="text-gray-500 text-xs font-medium">Fix Zone</Text>
          <Text className="text-xl font-bold text-gray-900">Welcome {user.name.split(' ')[0]} !</Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <TouchableOpacity className="mr-4" onPress={() => router.push('/profile')}>
          <View className="p-1 rounded-full border-2 border-orange-500">
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="person" size={20} color="#6B7280" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
