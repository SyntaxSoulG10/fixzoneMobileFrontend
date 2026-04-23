import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { COLORS } from '../../constants/colors';

export default function PromoBanner() {
  return (
    <View className="px-5 py-4">
      <View 
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{ backgroundColor: COLORS.primary }}
      >
        <View className="z-10">
          <View className="bg-orange-400 self-start px-2 py-1 rounded-md mb-2">
            <Text className="text-white text-[10px] font-bold">INSTANT BOOKING</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-1">Quick Service</Text>
          <Text className="text-white text-sm font-medium mb-4 w-3/4">
            Expert vehicle maintenance at your doorstep in minutes
          </Text>
          
          <TouchableOpacity className="bg-white px-5 py-2 rounded-xl self-start">
            <Text className="font-bold" style={{ color: COLORS.primary }}>Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Abstract car shape / icon on the right */}
        <View 
          className="absolute -right-4 bottom-0 opacity-20"
          style={{ width: 150, height: 150 }}
        >
          {/* Using a placeholder circle/shape to mimic the design's abstract element */}
          <View className="w-full h-full rounded-full bg-white scale-125 translate-x-10 translate-y-10" />
        </View>
      </View>
    </View>
  );
}
