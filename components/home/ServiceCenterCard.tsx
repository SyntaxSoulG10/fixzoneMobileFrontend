import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface ServiceCenterCardProps {
  image: string;
  name: string;
  location: string;
  type: string;
  distance: string;
}

export default function ServiceCenterCard({ image, name, location, type, distance }: ServiceCenterCardProps) {
  return (
    <TouchableOpacity 
      className="bg-gray-200 rounded-2xl flex-row items-center p-3 mb-4 border border-orange-100"
    >
      <Image 
        source={typeof image === 'string' ? { uri: image } : image} 
        className="w-16 h-16 rounded-xl"
      />
      <View className="flex-1 ml-4">
        <Text className="text-orange-600 text-base font-bold">{name} - {location}</Text>
        <Text className="text-gray-500 text-xs font-medium">{type} - {distance}</Text>
        <Text className="text-gray-500 text-[10px] mt-1">Served for :</Text>
        <View className="flex-row mt-1">
          <Ionicons name="bicycle-outline" size={16} color="black" className="mr-3" />
          <Ionicons name="car-outline" size={16} color="black" className="mr-3" />
          <Ionicons name="bus-outline" size={16} color="black" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
