import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SegmentedToggleProps {
  active: 'login' | 'signup';
  onChange: (value: 'login' | 'signup') => void;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({ active, onChange }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = React.useState(0);

  useEffect(() => {
    if (containerWidth > 0) {
      Animated.spring(translateX, {
        toValue: active === 'login' ? 0 : containerWidth / 2,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    }
  }, [active, containerWidth]);

  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width !== containerWidth) {
      setContainerWidth(width);
      // If it's the first layout, set the initial position without animation
      if (containerWidth === 0) {
        translateX.setValue(active === 'login' ? 0 : width / 2);
      }
    }
  };

  return (
    <View style={styles.segmentedControl} onLayout={onLayout}>
      <Animated.View 
        style={[
          styles.activeIndicator, 
          { 
            width: '50%',
            transform: [{ translateX }] 
          }
        ]} 
      />
      
      <TouchableOpacity 
        style={styles.segment}
        onPress={() => onChange('login')}
        activeOpacity={0.8}
      >
        <Text style={[styles.segmentText, active === 'login' && styles.segmentTextActive]}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.segment}
        onPress={() => onChange('signup')}
        activeOpacity={0.8}
      >
        <Text style={[styles.segmentText, active === 'signup' && styles.segmentTextActive]}>
          Sign up
        </Text>
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
    position: 'relative',
    backgroundColor: '#fff',
  },
  activeIndicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 30,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});

export default SegmentedToggle;
