import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import IconCircle from '../../components/ui/IconCircle';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import PasswordStrengthIndicator from '../../components/ui/PasswordStrengthIndicator';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/auth_context';
import Toast from 'react-native-toast-message';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const token = (params.token as string) || '';
  const email = (params.email as string) || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation checks
  const hasNew = newPassword.length > 0;
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  const hasConfirm = confirmPassword.length > 0;
  const isMatch = hasConfirm && confirmPassword === newPassword;
  const isConfirmMismatch = hasConfirm && confirmPassword.length >= 2 && confirmPassword !== newPassword;

  // Strength score
  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  let strengthLabel = '';
  let strengthColor = '#E5E7EB';
  let strengthWidth = '0%';

  if (hasNew) {
    if (strengthScore <= 2) {
      strengthLabel = 'Weak';
      strengthColor = '#EF4444';
      strengthWidth = '33%';
    } else if (strengthScore <= 4) {
      strengthLabel = 'Medium';
      strengthColor = '#F59E0B';
      strengthWidth = '66%';
    } else {
      strengthLabel = 'Strong';
      strengthColor = '#10B981';
      strengthWidth = '100%';
    }
  }

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  const handleResetPassword = async () => {
    if (!hasMinLength) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must be at least 8 characters' });
      return;
    }
    if (!hasUpper) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must contain at least 1 uppercase letter' });
      return;
    }
    if (!hasLower) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must contain at least 1 lowercase letter' });
      return;
    }
    if (!hasNumber) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must contain at least 1 number' });
      return;
    }
    if (!hasSpecial) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Password must contain at least 1 special character' });
      return;
    }
    if (!isMatch) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Passwords do not match' });
      return;
    }
    if (!token) {
      Toast.show({ type: 'error', text1: 'Invalid Request', text2: 'Reset token is missing. Please try requesting a new OTP.' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      Toast.show({
        type: 'success',
        text1: 'Password Reset Successful! 🎉',
        text2: 'Your password has been updated successfully.',
        position: 'top',
        visibilityTime: 4000,
      });
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
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

          {/* New Password Field */}
          <AppInput
            label="New Password"
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            rightIcon={showNewPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowNewPassword(!showNewPassword)}
          />

          <PasswordStrengthIndicator password={newPassword} />

          {/* Confirm New Password Field */}
          <AppInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ marginTop: 16 }}
          />

          {/* Realtime Confirm Mismatch / Match Feedback */}
          {isConfirmMismatch && (
            <View style={styles.feedbackRow}>
              <Ionicons name="alert-circle" size={15} color="#EF4444" />
              <Text style={styles.fieldErrorText}>Passwords do not match</Text>
            </View>
          )}
          {isMatch && (
            <View style={styles.feedbackRow}>
              <Ionicons name="checkmark-circle" size={15} color="#10B981" />
              <Text style={styles.fieldMatchText}>Passwords match</Text>
            </View>
          )}

          <AppButton
            label="Reset Password"
            onPress={handleResetPassword}
            style={styles.btn}
            disabled={!isFormValid || isLoading}
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

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={16}
        color={met ? "#10B981" : "#D1D5DB"}
      />
      <Text style={[styles.reqText, met ? styles.reqMetText : styles.reqUnmetText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 24,
    marginBottom: 20,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -8,
    marginBottom: 12,
  },
  strengthBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checklistContainer: {
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  reqText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  reqMetText: {
    color: '#059669',
    fontWeight: '600',
  },
  reqUnmetText: {
    color: '#6B7280',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  fieldErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  fieldMatchText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
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
