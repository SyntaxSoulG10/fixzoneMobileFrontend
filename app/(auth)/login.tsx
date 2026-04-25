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
  const { login } = useAuth();
  
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
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = () => {
    let isValid = true;
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    // Navigate to the final profile creation step
    router.push('/(auth)/complete-profile');
  };

  return (
    <ScreenContainer scrollable={mode === 'signup'}>
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
        onChangeText={(text) => { setEmail(text); setEmailError(''); }}
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
        onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
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

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>{mode === 'login' ? 'or login with' : 'or continue with'}</Text>
        <View style={styles.line} />
      </View>

      {mode === 'login' ? (
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="finger-print" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.googleBtn}>
          <Ionicons name="logo-google" size={24} color="#EA4335" />
          <Text style={styles.googleBtnText}>Sign Up with Google</Text>
        </TouchableOpacity>
      )}

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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#000',
  },
  orText: {
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  socialContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socialBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 30,
    height: 44,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 'auto',
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
});
