import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface PasswordStrengthBarProps {
  password?: string;
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ password = '' }) => {
  // Simple logic for UI purpose. Can easily be adjusted later.
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isMinLength = password.length >= 8;

  let strengthValue = 0;
  if (password.length > 0) {
    if (isMinLength) strengthValue += 1;
    if (hasUppercase) strengthValue += 1;
    if (hasNumber || hasSpecial) strengthValue += 1;
    if (hasUppercase && hasNumber && hasSpecial && isMinLength) strengthValue += 1;
  }

  // 0: none, 1: weak, 2: fair, 3-4: strong
  let strengthColor = COLORS.strengthBar;
  let strengthText = '';
  
  if (strengthValue === 1) {
    strengthColor = COLORS.strengthWeak;
    strengthText = 'Weak';
  } else if (strengthValue === 2) {
    strengthColor = COLORS.strengthFair;
    strengthText = 'Fair';
  } else if (strengthValue >= 3) {
    strengthColor = COLORS.strengthGood;
    strengthText = 'Good';
  }

  const bars = [1, 2, 3, 4];

  return (
    <View style={styles.container}>
      {/* Bars */}
      <View style={styles.barsContainer}>
        {bars.map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                backgroundColor:
                  bar <= strengthValue ? strengthColor : COLORS.strengthBar,
              },
            ]}
          />
        ))}
      </View>

      {/* Text Info */}
      <View style={styles.infoRow}>
        <Text style={styles.strengthLabel}>
          Strength:{' '}
          <Text style={{ color: strengthValue > 0 ? strengthColor : COLORS.textMuted }}>
            {strengthText || 'None'}
          </Text>
        </Text>
        <Text style={styles.minChars}>Must contain at least 8 chars</Text>
      </View>

      {/* Checkmarks */}
      <View style={styles.checkRow}>
        <CheckItem label="Uppercase" checked={hasUppercase} />
        <CheckItem label="Number" checked={hasNumber} />
        <CheckItem label="Special Char" checked={hasSpecial} />
      </View>
    </View>
  );
};

const CheckItem = ({ label, checked }: { label: string; checked: boolean }) => (
  <View style={styles.checkItem}>
    <Ionicons
      name="checkmark-circle"
      size={16}
      color={checked ? COLORS.success : COLORS.textMuted}
      style={{ marginRight: 4 }}
    />
    <Text style={styles.checkText}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  minChars: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkRow: {
    flexDirection: 'row',
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default PasswordStrengthBar;
