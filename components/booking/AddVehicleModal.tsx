import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import AppInput from '../ui/AppInput';
import AppButton from '../ui/AppButton';
import AppDropdown from '../ui/AppDropdown';
import { vehicleService } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';
import { imageKitService } from '../../services/imageKitService';
import { formatLicenseNumber, validateLicenseNumber } from '../../utils/vehicle_utils';
import { ALL_VEHICLE_TYPE_NAMES, getBrandsForVehicleType } from '../../constants/vehicle_data';

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const vehicleTypes = [...ALL_VEHICLE_TYPE_NAMES, 'Others'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'EV'];

export default function AddVehicleModal({ visible, onClose, onSuccess }: AddVehicleModalProps) {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [vType, setVType] = useState('');
  const [customVType, setCustomVType] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuel, setFuel] = useState('');
  const [plate, setPlate] = useState('');
  const [plateError, setPlateError] = useState<string | null>(null);
  const [vehicleImage, setVehicleImage] = useState<string | null>(null);

  const pickVehicleImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setVehicleImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const finalVType = vType === 'Others' ? customVType : vType;
    const finalBrand = brand === 'Other' ? customBrand : brand;

    if (!finalVType || !finalBrand || !model || !plate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const plateErr = validateLicenseNumber(plate);
    if (plateErr) {
      setPlateError(plateErr);
      return;
    }

    if (!user?.userId) return;

    setIsSaving(true);
    try {
      let imageUrl: string | undefined = undefined;
      if (vehicleImage && !vehicleImage.startsWith('http')) {
        imageUrl = await imageKitService.uploadToImageKit(vehicleImage, `vehicle_${plate}.jpg`);
      } else if (vehicleImage) {
        imageUrl = vehicleImage;
      }

      await vehicleService.createVehicle({
        customerId: user.userId,
        brand: finalBrand,
        model,
        vehicleType: finalVType,
        plateNumber: plate,
        imageUrl: imageUrl,
      });

      Alert.alert('Success', 'Vehicle added!');
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save vehicle');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Vehicle</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <AppDropdown
            label="Vehicle Type"
            placeholder="Select Type"
            value={vType}
            options={vehicleTypes}
            onSelect={(val) => {
              setVType(val);
              setBrand('');
              if (val !== 'Others') setCustomVType('');
            }}
          />

          {vType === 'Others' && (
            <AppInput
              label="Custom Vehicle Type"
              placeholder="e.g. Electric Scooter"
              value={customVType}
              onChangeText={setCustomVType}
            />
          )}

          <AppDropdown
            label="Brand"
            placeholder={!vType ? 'Select vehicle type first' : 'Select Brand'}
            value={brand}
            options={getBrandsForVehicleType(vType)}
            disabled={!vType}
            onDisabledPress={() => {
              Alert.alert('Selection Required', 'Please select a vehicle type first.');
            }}
            onSelect={(val) => {
              setBrand(val);
              if (val !== 'Other') setCustomBrand('');
            }}
          />

          {brand === 'Other' && (
            <AppInput
              label="Custom Brand"
              placeholder="e.g. Tesla"
              value={customBrand}
              onChangeText={setCustomBrand}
            />
          )}

          <AppInput
            label="Model"
            placeholder="e.g. Civic"
            value={model}
            onChangeText={setModel}
          />

          <AppInput
            label="Vehicle Plate Number"
            placeholder="e.g. CAB-1234"
            value={plate}
            onChangeText={(text) => {
              const formatted = formatLicenseNumber(text);
              setPlate(formatted);
              if (plateError) {
                setPlateError(validateLicenseNumber(formatted));
              }
            }}
            maxLength={10}
            autoCapitalize="characters"
            error={plateError || undefined}
          />

          <TouchableOpacity style={styles.imagePlaceholder} onPress={pickVehicleImage}>
            {vehicleImage ? (
              <Image source={{ uri: vehicleImage }} style={styles.uploadedImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
                <Text style={styles.imagePlaceholderText}>Upload Vehicle Image</Text>
              </>
            )}
          </TouchableOpacity>

          <AppButton
            label={isSaving ? 'Saving...' : 'Add Vehicle'}
            onPress={handleSave}
            style={styles.saveBtn}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  form: { flex: 1, padding: 20 },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  uploadedImage: { width: '100%', height: '100%' },
  imagePlaceholderText: { color: '#9CA3AF', fontSize: 13, marginTop: 8, fontWeight: '500' },
  saveBtn: { marginTop: 30 },
});
