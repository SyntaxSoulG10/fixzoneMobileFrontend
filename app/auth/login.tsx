import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import SegmentedToggle from '../../components/ui/SegmentedToggle';
import { COLORS } from '../../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleLogin = () => {
    // Navigate home
    router.replace('/');
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleRegister = () => {
    router.push('/auth/signup');
  };

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
      
        <Image 
          source={require('../../assets/images/fixzone-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your vehicle service and maintenance history
        </Text>
      </View>

      <SegmentedToggle 
        active="login" 
        onChange={(val) => {
          if (val === 'signup') {
            router.replace('/auth/signup');
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
        style={{ marginBottom: 4 }}
      />

      <AppInput
        label="Password"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        isPassword
        style={{ marginBottom: 4 }}
      />

      <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer}>
        <Text style={styles.forgotText}>Forgot Password ?</Text>
      </TouchableOpacity>

      <AppButton
        label="Login"
        onPress={handleLogin}
        style={styles.btn}
        rightIcon="log-in-outline"
      />

      <View style={styles.dividerContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>or login with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialBtn}>
          <Ionicons name="person-circle-outline" size={32} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account ? </Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.registerLink}>Register</Text>
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
    marginBottom: 10,
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
    marginBottom: 'auto',
  },
  socialBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 20,
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
});
