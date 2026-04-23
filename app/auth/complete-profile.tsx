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

// Fallback Hardcoded Arrays Setup
const vehicleTypes = ['Car', 'Bike', 'Three Wheels', 'Van', 'Lorry', 'Others'];

const brandMap: Record<string, string[]> = {
  'Car': ['Toyota', 'Honda', 'Nissan', 'BMW', 'Suzuki', 'Kia', 'Other'],
  'Bike': ['Yamaha', 'Honda', 'Suzuki', 'Bajaj', 'TVS', 'Hero', 'Other'],
  'Three Wheels': ['Bajaj', 'TVS', 'Piaggio', 'Other'],
  'Van': ['Nissan', 'Toyota', 'Ford', 'Other'],
  'Lorry': ['Isuzu', 'Mitsubishi', 'Tata', 'Ashok Leyland', 'Other'],
};

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'EV'];

export default function CompleteProfileScreen() {
  const router = useRouter();
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Primary toggle
  const [addVehicle, setAddVehicle] = useState(false);

  // Vehicle state
  const [vehicleType, setVehicleType] = useState('');
  const [customType, setCustomType] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const availableBrands = brandMap[vehicleType] || [];

  const handleCreateAccount = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/');
    }, 1500);
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

      <View style={styles.toggleCard}>
        <View style={styles.toggleCardContent}>
          <Ionicons name="car" size={26} color={COLORS.primary} style={styles.toggleIcon} />
          <View style={styles.toggleTextWrapper}>
            <Text style={styles.toggleTitle}>Add vehicle details ?</Text>
            <Text style={styles.toggleSubtitle}>Save time later by adding it now</Text>
          </View>
          <Switch
            value={addVehicle}
            onValueChange={setAddVehicle}
            trackColor={{ false: '#e5e7eb', true: '#FED7AA' }}
            thumbColor={addVehicle ? COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {addVehicle && (
        <View style={styles.vehicleForm}>
          <AppDropdown
            label="Vehicle Type"
            placeholder="Select Type"
            value={vehicleType}
            options={vehicleTypes}
            onSelect={(val) => {
              setVehicleType(val);
              setBrand(''); // reset brand naturally when type changes
            }}
          />

          {vehicleType === 'Others' && (
            <AppInput
              label="Specify Vehicle Type"
              placeholder="e.g. Tractor"
              value={customType}
              onChangeText={setCustomType}
            />
          )}

          <AppDropdown
            label="Brand"
            placeholder="Select Brand"
            value={brand}
            options={availableBrands.length > 0 ? availableBrands : ['Other']}
            onSelect={setBrand}
          />

          {(brand === 'Other' || vehicleType === 'Others') && (
            <AppInput
              label="Specify Brand"
              placeholder="e.g. Ford"
              value={customBrand}
              onChangeText={setCustomBrand}
            />
          )}

          <AppInput
            label="Model"
            placeholder="Select Model"
            value={model}
            onChangeText={setModel}
          />

          <AppDropdown
            label="Fuel Type ⚡"
            placeholder="Select Fuel Type"
            value={fuelType}
            options={fuelTypes}
            onSelect={setFuelType}
          />

          <AppInput
            label="License Number"
            placeholder="e.g. ABC 1234"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            autoCapitalize="characters"
          />

          <View style={styles.primaryToggleContainer}>
            <Text style={styles.primaryToggleText}>Set as Primary Vehicle</Text>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{ false: '#e5e7eb', true: COLORS.primary }}
              thumbColor={'#fff'}
            />
          </View>
        </View>
      )}

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
  toggleCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  toggleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 16,
  },
  toggleTextWrapper: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  vehicleForm: {
    backgroundColor: '#fffbf5', // Light yellow/orange tint as per design
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  primaryToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
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
