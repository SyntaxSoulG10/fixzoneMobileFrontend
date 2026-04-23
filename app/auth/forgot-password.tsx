import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import IconCircle from '../../components/ui/IconCircle';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import { COLORS } from '../../constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text.length > 0 && (!text.includes('@') || !text.includes('.'))) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  };

  const handleSendCode = () => {
    // In a real app we would call an API here
    router.push('/auth/verify-otp');
  };

  return (
    <ScreenContainer>
      <BackButton />
      
      <View style={styles.header}>
        <IconCircle iconName="lock-closed" size={72} iconSize={32} />
        <Text style={styles.title}>Forgot Password ?</Text>
        <Text style={styles.subtitle}>
          Don't worry ! It happens. Please enter the email or phone number associated with your account
        </Text>
      </View>

      <AppInput
        label="Email ID/ Phone Number"
        placeholder="user@example.com"
        value={email}
        onChangeText={validateEmail}
        error={emailError}
        rightIcon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AppButton
        label="Send Verification Code"
        onPress={handleSendCode}
        style={styles.btn}
        disabled={!email || !!emailError}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Remember Password ? </Text>
        <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supportContainer}>
        <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
        <Text style={styles.supportText}>Contact Support</Text>
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
