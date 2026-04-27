import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import IconCircle from '../../components/ui/IconCircle';
import AppButton from '../../components/ui/AppButton';
import { COLORS } from '../../constants/colors';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    // In a real app we verify code here
    router.push('/(auth)/set-new-password');
  };

  return (
    <ScreenContainer>
      <BackButton />
      
      <View style={styles.header}>
        <IconCircle iconName="mail" size={72} iconSize={32} />
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We&apos;ve sent a code to your registered email or phone number.Please enter it below to verify your identity.
        </Text>
      </View>

      <Text style={styles.label}>Verification Code</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="o  o  o  o  o"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="number-pad"
          maxLength={5}
          value={code}
          onChangeText={setCode}
          textAlign="center"
        />
      </View>

      <AppButton
        label="Verify"
        onPress={handleVerify}
        style={styles.btn}
        disabled={code.length !== 5}
      />

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn&apos;t receive the code ? </Text>
        <TouchableOpacity>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.supportContainer}>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    height: 54,
    justifyContent: 'center',
    marginBottom: 24,
  },
  input: {
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: 8,
  },
  btn: {
    marginBottom: 24,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  supportContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
    paddingBottom: 20,
  },
  supportText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
