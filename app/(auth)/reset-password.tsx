import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import IconCircle from '../../components/ui/IconCircle';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = (params.token as string) || '';
  const email = (params.email as string) || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateNewPassword = (text: string) => {
    setNewPassword(text);
    if (text.length > 0 && text.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
    } else {
      setNewPasswordError('');
    }
    if (confirmPassword.length > 0 && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else if (confirmPassword.length > 0) {
      setConfirmPasswordError('');
    }
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    if (text.length > 0 && text !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Request',
        text2: 'Reset token is missing. Please try requesting a new OTP.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      Toast.show({
        type: 'success',
        text1: 'Password Reset Successful! 🎉',
        text2: 'You can now log in with your new password.',
        position: 'top',
        visibilityTime: 5000,
      });
      router.replace('/(auth)/login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error?.message || 'Invalid or expired OTP code. Please try again.',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer style={{ paddingHorizontal: 20 }}>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <IconCircle iconName="key" size={72} iconSize={32} />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter a new, strong password for {email || 'your account'}.
            </Text>
          </View>

          <AppInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={validateNewPassword}
            secureTextEntry={!showNewPassword}
            error={newPasswordError}
            rightIcon={showNewPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowNewPassword(!showNewPassword)}
          />

          <AppInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            error={confirmPasswordError}
            rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <AppButton
            label="Reset Password"
            onPress={handleResetPassword}
            style={styles.btn}
            disabled={!newPassword || !confirmPassword || !!newPasswordError || !!confirmPasswordError || isLoading}
            loading={isLoading}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember Password ? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 20,
    marginBottom: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
