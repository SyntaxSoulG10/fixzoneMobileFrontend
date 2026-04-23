import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SegmentedToggleProps {
  active: 'login' | 'signup';
  onChange: (value: 'login' | 'signup') => void;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ active, onChange }) => {
  return (
    <View style={styles.segmentedControl}>
      <TouchableOpacity 
        style={[styles.segment, active === 'login' && styles.segmentActive]}
        onPress={() => onChange('login')}
        activeOpacity={0.8}
      >
        <Text style={styles.segmentText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.segment, active === 'signup' && styles.segmentActive]}
        onPress={() => onChange('signup')}
        activeOpacity={0.8}
      >
        <Text style={styles.segmentText}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    height: 50,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 30,
  },
  segmentActive: {
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});

export default SegmentedToggle;
