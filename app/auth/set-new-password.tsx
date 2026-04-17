import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import IconCircle from '../../components/ui/IconCircle';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import PasswordStrengthBar from '../../components/ui/PasswordStrengthBar';
import { COLORS } from '../../constants/colors';

export default function SetNewPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const confirmError = confirmPassword && confirmPassword !== password 
    ? 'Passwords do not match' 
    : '';

  const handleSetPassword = () => {
    // In a real app we'd validate and save
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/auth/login' as any);
  };

  return (
    <ScreenContainer>
      <BackButton />
      
      <View style={styles.header}>
        <IconCircle iconName="lock-closed" size={72} iconSize={32} />
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>
          Create a strong password to secure your supervisor account.
        </Text>
      </View>

      <AppInput
        label="New Password"
        placeholder="Enter new password"
        value={password}
        onChangeText={setPassword}
        isPassword
      />

      <PasswordStrengthBar password={password} />

      <AppInput
        label="Confirm New Password"
        placeholder="Re-enter new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        error={confirmError}
      />

      <AppButton
        label="Set New Password"
        onPress={handleSetPassword}
        style={styles.btn}
        disabled={!password || !confirmPassword || password !== confirmPassword}
      />

      <AppButton
        label="Cancel"
        variant="text"
        onPress={handleCancel}
      />

      <View style={styles.supportContainer}>
        <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
        <Text style={styles.supportText}>Need Help ?</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 60,
    marginBottom: 12,
  },
  supportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
    paddingBottom: 20,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
});
