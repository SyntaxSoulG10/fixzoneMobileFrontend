import React from 'react';
import { View, Text } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';

export default function HistoryScreen() {
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>History Screen</Text>
        <Text style={{ color: 'gray', marginTop: 10 }}>Coming Soon!</Text>
      </View>
    </ScreenContainer>
  );
}
