import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenContainer from '../../components/ui/ScreenContainer';
import BackButton from '../../components/ui/BackButton';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import AppDropdown from '../../components/ui/AppDropdown';
import { COLORS } from '../../constants/colors';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/auth_context';



export default function CompleteProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateUser, addVehicle: saveVehicle } = useUser();
  const { signup, error: authError } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (num: string) => {
    // Remove any spaces or non-digit characters
    const cleaned = num.replace(/\D/g, '');
    
    // Sri Lankan mobile numbers are typically 9 digits (after +94) or 10 digits (starting with 0)
    // Here we expect the user to enter the 9 digits after +94
    if (cleaned.length !== 9 || !cleaned.startsWith('7')) {
      return false;
    }
    return true;
  };

  const handleCreateAccount = async () => {
    if (!fullName) return;
    if (!phone) {
      setPhoneError('Phone number is required');
      return;
    }
    
    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid 9-digit mobile number (e.g. 771234567)');
      return;
    }

    setPhoneError('');
    setIsLoading(true);
    try {
      const email = params.email as string;
      const password = params.password as string;

      await signup({
        fullName,
        email,
        password,
        phone: `+94 ${phone.replace(/\s/g, '')}`
      });

      updateUser({
        name: fullName,
        mobile: `+94 ${phone.replace(/\s/g, '')}`,
      });
    } catch (error) {
      console.error('Signup failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const phonePrefix = (
    <View style={styles.phonePrefix}>
      <Text style={styles.phonePrefixText}>🇱🇰 +94</Text>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      <BackButton />
      
      <View style={styles.header}>
        <Text style={styles.title}>Manage your vehicle care</Text>
        <Text style={styles.titleHighlight}>Effortlessly.</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppInput
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />

        <AppInput
          label="Phone number"
          placeholder="7x xxx xxxx"
          value={phone}
          onChangeText={(text) => { setPhone(text); setPhoneError(''); }}
          error={phoneError}
          keyboardType="phone-pad"
          leftElement={phonePrefix}
        />

        <View style={styles.instructionCard}>
          <View style={styles.instructionContent}>
            <Ionicons name="information-circle" size={26} color={COLORS.primary} style={styles.instructionIcon} />
            <View style={styles.instructionTextWrapper}>
              <Text style={styles.instructionTitle}>Vehicle Details</Text>
              <Text style={styles.instructionSubtitle}>Please add your vehicles in the dashboard before booking any service.</Text>
            </View>
          </View>
        </View>

        <AppButton
          label="Sign up"
          onPress={handleCreateAccount}
          style={styles.btn}
          loading={isLoading}
          disabled={!fullName || !phone || isLoading}
        />

        {authError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        <View style={styles.footerLinks}>
          <Text style={styles.footerText}>
            By signing up, you agree to our{' '}
            <Text style={styles.footerTextLink}>Terms of Services & Privacy policy</Text>
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000',
  },
  titleHighlight: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 12,
    marginRight: 12,
  },
  phonePrefixText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  instructionCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#FFF7ED', // Light orange background
  },
  instructionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionIcon: {
    marginRight: 16,
  },
  instructionTextWrapper: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  btn: {
    marginBottom: 16,
    marginTop: 8,
  },
  footerLinks: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerTextLink: {
    color: COLORS.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
});
