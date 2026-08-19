import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SegmentedToggle from '../../components/ui/SegmentedToggle';
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

  const handleModeChange = (newMode: 'login' | 'signup') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(newMode);
    // Clear errors when switching
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
      // Error is handled in context and exposed via authError
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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }
    if (password !== confirmPassword) {
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
        <AppInput
          label="Confirm Password"
          placeholder="********"
          value={confirmPassword}
          onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(''); }}
          error={confirmPasswordError}
          isPassword
          style={{ marginBottom: 4 }}
        />
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
        rightIcon={mode === 'login' ? "log-in-outline" : undefined}
        loading={isSubmitting}
        disabled={isSubmitting}
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
