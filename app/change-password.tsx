import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import { useAuth } from '../context/auth_context';
import Toast from 'react-native-toast-message';
import PasswordStrengthIndicator from '../components/ui/PasswordStrengthIndicator';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Client-side validation checks
  const hasCurrent = currentPassword.trim().length > 0;
  const isCurrentMinLength = currentPassword.length >= 8;

  const hasNew = newPassword.length > 0;
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isDifferentFromCurrent = hasNew && currentPassword.length > 0 && newPassword !== currentPassword;

  const hasConfirm = confirmPassword.length > 0;
  const isMatch = hasConfirm && confirmPassword === newPassword;
  const isConfirmMismatch = hasConfirm && confirmPassword.length >= 2 && confirmPassword !== newPassword;

  // Password strength calculation
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

  // Form validity for button state
  const isFormValid =
    hasCurrent &&
    isCurrentMinLength &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    isDifferentFromCurrent &&
    isMatch;

  const handleChangePassword = async () => {
    // Validation error checks before submitting
    if (!hasCurrent) {
      Alert.alert('Required Field', 'Current password is required');
      return;
    }
    if (!isCurrentMinLength) {
      Alert.alert('Validation Error', 'Current password must be at least 8 characters');
      return;
    }
    if (!hasNew) {
      Alert.alert('Required Field', 'New password is required');
      return;
    }
    if (!hasMinLength) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }
    if (!hasUpper) {
      Alert.alert('Validation Error', 'Password must contain at least one uppercase letter');
      return;
    }
    if (!hasLower) {
      Alert.alert('Validation Error', 'Password must contain at least 1 lowercase letter');
      return;
    }
    if (!hasNumber) {
      Alert.alert('Validation Error', 'Password must contain at least 1 number');
      return;
    }
    if (!hasSpecial) {
      Alert.alert('Validation Error', 'Password must contain at least 1 special character');
      return;
    }
    if (!isDifferentFromCurrent) {
      Alert.alert('Validation Error', 'New password must be different from your current password');
      return;
    }
    if (!hasConfirm) {
      Alert.alert('Required Field', 'Please confirm your new password');
      return;
    }
    if (!isMatch) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      Alert.alert(
        'Password Changed Successfully 🎉',
        'Your password has been updated in our security records.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const msg = error?.message || 'Failed to change password. Please check your current password.';
      Alert.alert('Password Change Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      router.push('/(auth)/forgot-password');
      return;
    }

    setIsForgotLoading(true);
    try {
      await authService.forgotPassword(user.email);
      Toast.show({
        type: 'info',
        text1: 'Verification Code Sent 📧',
        text2: `A 5-digit OTP code has been sent to ${user.email}`,
      });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: user.email, mode: 'reset_password' }
      });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.subtitle}>
            Enter your current password and choose a new, secure password for your FixZone account.
          </Text>

          {/* Current Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[
              styles.inputContainer,
              currentPassword.length > 0 && (!isCurrentMinLength ? styles.invalidBorder : styles.validBorder)
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={showCurrentPassword ? "#E84E0F" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>
            {currentPassword.length > 0 && !isCurrentMinLength && (
              <Text style={styles.fieldErrorText}>Password must be at least 8 characters</Text>
            )}
          </View>

          {/* New Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[
              styles.inputContainer,
              hasNew && (strengthScore === 5 && isDifferentFromCurrent ? styles.validBorder : styles.focusBorder)
            ]}>
              <Ionicons name="key-outline" size={20} color={hasNew && strengthScore === 5 ? "#10B981" : "#9CA3AF"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={showNewPassword ? "#E84E0F" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            <PasswordStrengthIndicator password={newPassword} />
            {hasNew && !isDifferentFromCurrent && currentPassword.length > 0 && (
              <View style={styles.reqRow}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={[styles.reqText, { color: '#EF4444' }]}>Must be different from current password</Text>
              </View>
            )}
          </View>

          {/* Confirm Password Field */}
          <View style={[styles.inputGroup, { marginTop: 6 }]}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[
              styles.inputContainer,
              hasConfirm && (isMatch ? styles.validBorder : (isConfirmMismatch ? styles.invalidBorder : styles.focusBorder))
            ]}>
              <Ionicons
                name={hasConfirm ? (isMatch ? "checkmark-circle-outline" : "close-circle-outline") : "checkmark-circle-outline"}
                size={20}
                color={hasConfirm ? (isMatch ? "#10B981" : "#EF4444") : "#9CA3AF"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: 4 }}>
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={showConfirmPassword ? "#E84E0F" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>

            {/* Realtime Confirm Error / Match Feedback */}
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
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={handleForgotPassword}
            disabled={isForgotLoading}
          >
            {isForgotLoading ? (
              <ActivityIndicator size="small" color="#E84E0F" />
            ) : (
              <Text style={styles.forgotText}>Forgot your current password?</Text>
            )}
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!isFormValid || isLoading) && styles.submitBtnDisabled]}
            onPress={handleChangePassword}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text style={styles.submitBtnText}>Change Password</Text>
                {isFormValid && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 25,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FAFAFA',
  },
  focusBorder: {
    borderColor: '#E84E0F',
  },
  validBorder: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  invalidBorder: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
    marginTop: 10,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 25,
    marginTop: 5,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E84E0F',
  },
  submitBtn: {
    backgroundColor: '#E84E0F',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#F3F4F6',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
