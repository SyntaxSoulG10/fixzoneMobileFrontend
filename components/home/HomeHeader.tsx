import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { MOCK_USER } from '../../constants/mock_data';

export default function HomeHeader() {
  const profileImage = MOCK_USER.profileImage;
  
  return (
    <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-white">
      <View className="flex-row items-center">
        <TouchableOpacity className="mr-4">
          <Ionicons name="menu" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text className="text-gray-500 text-xs font-medium">Fix Zone</Text>
          <Text className="text-xl font-bold text-gray-900">Welcome {MOCK_USER.name.split(' ').pop()} !</Text>
        </View>
      </View>
      
      <View className="flex-row items-center">
        <TouchableOpacity className="mr-4">
          <View className="p-1 rounded-full border-2 border-orange-500">
            <Image 
              source={typeof profileImage === 'string' ? { uri: profileImage } : profileImage} 
              className="w-10 h-10 rounded-full"
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
