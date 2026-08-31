import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordStrengthIndicatorProps {
  password: string;
  showMinLengthHint?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  showMinLengthHint = true,
}: PasswordStrengthIndicatorProps) {
  const hasPassword = password.length > 0;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const score = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let activeBars = 0;
  let label = '';
  let color = '#10B981';

  if (hasPassword) {
    if (score <= 1) {
      activeBars = 1;
      label = 'Weak';
      color = '#EF4444';
    } else if (score <= 3) {
      activeBars = 2;
      label = 'Medium';
      color = '#F59E0B';
    } else if (score === 4) {
      activeBars = 3;
      label = 'Good';
      color = '#10B981';
    } else {
      activeBars = 4;
      label = 'Strong';
      color = '#10B981';
    }
  }

  return (
    <View style={styles.container}>
      {/* 4 Segmented Pill Progress Bars */}
      <View style={styles.segmentedRow}>
        {[1, 2, 3, 4].map((barNum) => (
          <View
            key={barNum}
            style={[
              styles.segmentPill,
              { backgroundColor: barNum <= activeBars ? color : '#4A423D' },
            ]}
          />
        ))}
      </View>

      {/* Strength Label + Helper Text */}
      <View style={styles.textRow}>
        <Text style={styles.strengthText}>
          Strength:{' '}
          <Text style={{ color: hasPassword ? color : '#71717A', fontWeight: '700' }}>
            {label || '—'}
          </Text>
        </Text>
        {showMinLengthHint && (
          <Text style={styles.hintText}>
            {hasMinLength ? '' : 'Must contain at least 8 chars'}
          </Text>
        )}
      </View>

      {/* Compact Badges Row */}
      <View style={styles.badgesRow}>
        <CheckItem met={hasUpper} label="Uppercase" />
        <CheckItem met={hasLower} label="Lowercase" />
        <CheckItem met={hasNumber} label="Number" />
        <CheckItem met={hasSpecial} label="Special Char" />
      </View>
    </View>
  );
}

function CheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.checkItem}>
      <Ionicons
        name="checkmark-circle"
        size={13}
        color={met ? '#10B981' : '#52525B'}
        style={{ marginRight: 2 }}
      />
      <Text style={[styles.checkLabel, { color: met ? '#374151' : '#6B7280' }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 14,
  },
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  segmentPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  strengthText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  hintText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '400',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 5,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
