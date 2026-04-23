import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface SearchBarProps {
  onFilterPress?: () => void;
}

export default function SearchBar({ onFilterPress }: SearchBarProps) {
  return (
    <View className="px-5 py-2">
      <View 
        className="flex-row items-center px-4 h-12 rounded-xl border border-orange-200 bg-white shadow-sm"
        style={{ borderColor: '#FF9E7D' }}
      >
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput 
          placeholder="Search Service Station ..."
          className="flex-1 ml-2 text-base text-gray-700"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity className="ml-2" onPress={onFilterPress}>
          <Ionicons name="options-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
