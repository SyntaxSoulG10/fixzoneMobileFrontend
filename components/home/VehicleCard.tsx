import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

interface VehicleCardProps {
  image: string;
  name: string;
  plate: string;
  status: string;
  lastService: string;
}

export default function VehicleCard({ image, name, plate, status, lastService }: VehicleCardProps) {
  return (
    <TouchableOpacity 
      className="bg-gray-100 rounded-3xl overflow-hidden mr-4 w-64 border border-gray-200"
    >
      <Image 
        source={{ uri: image }} 
        className="w-full h-32"
        resizeMode="cover"
      />
      <View className="p-4 bg-gray-200/50">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-lg font-bold text-gray-900">{name}</Text>
            <Text className="text-gray-500 text-xs font-medium">{plate}</Text>
          </View>
          <View className="bg-red-400 px-2 py-1 rounded-md">
            <Text className="text-white text-[10px] font-bold">{status}</Text>
          </View>
        </View>
        
        <View>
          <Text className="text-gray-900 text-sm font-bold">Last Service Date</Text>
          <Text className="text-gray-500 text-xs">{lastService}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
