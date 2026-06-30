import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { isServiceCenterOpen } from '../../utils/businessHours';

interface StatusBadgeProps {
  openingHours?: string;
}

export default function StatusBadge({ openingHours }: StatusBadgeProps) {
  const status = isServiceCenterOpen(openingHours);

  let bgColor = '#F3F4F6';
  let textColor = '#6B7280';
  let text = 'Hours unavailable';

  if (status === true) {
    bgColor = '#DCFCE7'; // Light green
    textColor = '#166534'; // Dark green
    text = 'OPEN';
  } else if (status === false) {
    bgColor = '#FEE2E2'; // Light red
    textColor = '#991B1B'; // Dark red
    text = 'CLOSED';
  }

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
      </View>
      {openingHours ? (
        <Text style={styles.hoursText}>{openingHours}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hoursText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
});
