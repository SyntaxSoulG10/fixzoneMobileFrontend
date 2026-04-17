import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface IconCircleProps {
  iconName: keyof typeof Ionicons.glyphMap;
  size?: number;
  iconSize?: number;
}

const IconCircle: React.FC<IconCircleProps> = ({
  iconName,
  size = 80,
  iconSize = 36,
}) => {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Ionicons name={iconName} size={iconSize} color={COLORS.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDBA74', // Subtle stroke around the circle based on design
  },
});

export default IconCircle;
