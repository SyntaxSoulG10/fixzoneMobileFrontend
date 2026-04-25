import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { updateUser, addVehicle: saveVehicle } = useUser();
  const { login } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async () => {
    setIsLoading(true);
    
    // 1. Update user profile
    updateUser({
      name: fullName,
      mobile: `+94 ${phone}`,
    });



    // 3. Log in (this will trigger redirect to Home via _layout.tsx)
    await login();
    setIsLoading(false);
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
          onChangeText={setPhone}
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
          disabled={!fullName || !phone}
        />

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
});
