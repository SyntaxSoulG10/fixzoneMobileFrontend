import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SegmentedToggle from '../../components/ui/SegmentedToggle';
import PasswordStrengthIndicator from '../../components/ui/PasswordStrengthIndicator';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/auth_context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login, error: authError, clearError } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup'>((params.initialMode as 'login' | 'signup') || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup password complexity checks
  const hasPassword = password.length > 0;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const hasConfirm = confirmPassword.length > 0;
  const isMatch = hasConfirm && confirmPassword === password;
  const isConfirmMismatch = hasConfirm && confirmPassword.length >= 2 && confirmPassword !== password;

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  let strengthLabel = '';
  let strengthColor = '#E5E7EB';
  let strengthWidth = '0%';

  if (hasPassword) {
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

  const handleModeChange = (newMode: 'login' | 'signup') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(newMode);
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    clearError();
  };

  const handleLogin = async () => {
    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!email.includes('@') || !email.includes('.')) {
      setEmailError('Invalid email format');
      isValid = false;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (error) {
      // Error handled in auth_context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = () => {
    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Invalid email format');
        isValid = false;
      }
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setPasswordError('Password must meet all complexity requirements below');
      isValid = false;
    }

    if (!isMatch) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    // Navigate to the final profile creation step
    router.push({
      pathname: '/(auth)/complete-profile',
      params: { email, password }
    });
  };

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/fixzone-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{mode === 'login' ? 'Welcome Back' : 'Welcome'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' 
            ? 'Sign in to manage your vehicle service and maintenance history'
            : 'Sign up to manage your vehicle service and maintenance history'}
        </Text>
      </View>

      <SegmentedToggle 
        active={mode} 
        onChange={handleModeChange} 
      />

      <AppInput
        label="Email Address"
        placeholder="user@example.com"
        value={email}
        onChangeText={(text) => { setEmail(text); setEmailError(''); clearError(); }}
        error={emailError}
        rightIcon="mail"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 4 }}
      />

      <AppInput
        label="Password"
        placeholder="********"
        value={password}
        onChangeText={(text) => { setPassword(text); setPasswordError(''); clearError(); }}
        error={passwordError}
        isPassword
        style={{ marginBottom: 4 }}
      />

      {mode === 'signup' && (
        <PasswordStrengthIndicator password={password} />
      )}

      {mode === 'signup' && (
        <>
          <AppInput
            label="Confirm Password"
            placeholder="********"
            value={confirmPassword}
            onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(''); }}
            error={confirmPasswordError}
            isPassword
            style={{ marginBottom: 4, marginTop: 8 }}
          />

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
        </>
      )}

      {authError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={COLORS.error || '#FF3B30'} />
          <Text style={styles.errorText}>{authError}</Text>
        </View>
      )}

      {mode === 'login' && (
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotContainer}>
          <Text style={styles.forgotText}>Forgot Password ?</Text>
        </TouchableOpacity>
      )}

      <AppButton
        label={mode === 'login' ? 'Login' : 'Create Account'}
        onPress={mode === 'login' ? handleLogin : handleSignup}
        style={styles.btn}
        loading={isSubmitting}
        disabled={isSubmitting || (mode === 'signup' && (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial || !isMatch))}
      />

      <View style={styles.bottomContainer}>
        <Text style={styles.bottomText}>
          {mode === 'login' ? "Don't have an account ? " : "Already have an account ? "}
        </Text>
        <TouchableOpacity onPress={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.bottomLink}>{mode === 'login' ? 'Register' : 'Log In'}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.reqRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={15}
        color={met ? "#10B981" : "#D1D5DB"}
      />
      <Text style={[styles.reqText, met ? styles.reqMetText : styles.reqUnmetText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  logo: {
    width: 140,
    height: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  btn: {
    marginBottom: 20,
    marginTop: 12,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
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
    marginBottom: 12,
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
    marginTop: 2,
    marginBottom: 10,
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
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  bottomText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  bottomLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});
