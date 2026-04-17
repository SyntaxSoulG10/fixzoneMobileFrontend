import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SegmentedToggle from '../../components/ui/SegmentedToggle';
import { COLORS } from '../../constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');

  const handleCreateAccount = () => {
    // Navigate home or to account creation
    router.replace('/');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/fixzone-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Sign up to manage your vehicle service and maintenance history
        </Text>
      </View>

      <SegmentedToggle 
        active="signup" 
        onChange={(val) => {
          if (val === 'login') {
            router.replace('/auth/login');
          }
        }} 
      />

      <AppInput
        label="Email Address"
        placeholder="user@example.com"
        value={email}
        onChangeText={setEmail}
        rightIcon="mail"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 0 }}
      />

      <AppInput
        label="Password"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        isPassword
        style={{ marginBottom: 0 }}
      />

      <AppInput
        label="Confirm Password"
        placeholder="********"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        style={{ marginBottom: 0 }}
      />

      <AppButton
        label="Create Account"
        onPress={handleCreateAccount}
        style={styles.btn}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.googleBtn}>
        <Ionicons name="logo-google" size={24} color="#EA4335" />
        <Text style={styles.googleBtnText}>Sign Up with Google</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Already have an account ? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.registerLink}>Log In</Text>
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
    paddingHorizontal: 12,
  },
  btn: {
    marginTop: 0,
    marginBottom: 8,
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
    marginBottom: 12,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  registerText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
});
