import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from "expo-image-picker";
import ScreenContainer from '../../components/ui/ScreenContainer';
import AppInput from '../../components/ui/AppInput';
import AppButton from '../../components/ui/AppButton';
import AppDropdown from '../../components/ui/AppDropdown';
import { COLORS } from '../../constants/colors';
import { MOCK_VEHICLES, Vehicle } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

// Form data from complete-profile
const vehicleTypes = ['Car', 'Bike', 'Three Wheels', 'Van', 'Lorry', 'Others'];
const brandMap: Record<string, string[]> = {
  'Car': ['Toyota', 'Honda', 'Nissan', 'BMW', 'Suzuki', 'Kia', 'Other'],
  'Bike': ['Yamaha', 'Honda', 'Suzuki', 'Bajaj', 'TVS', 'Hero', 'Other'],
  'Three Wheels': ['Bajaj', 'TVS', 'Piaggio', 'Other'],
  'Van': ['Nissan', 'Toyota', 'Ford', 'Other'],
  'Lorry': ['Isuzu', 'Mitsubishi', 'Tata', 'Ashok Leyland', 'Other'],
};
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'EV'];

const DEFAULT_VEHICLE_IMAGE = require('../../assets/images/honda_civic_red.jpg');

export default function VehiclesScreen() {
  const router = useRouter();
  const { add } = useLocalSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (add === 'true') {
      openModal();
    }
  }, [add]);

  // Form State
  const [vType, setVType] = useState('');
  const [customVType, setCustomVType] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuel, setFuel] = useState('');
  const [plate, setPlate] = useState('');
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

  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      // In a real app we'd have full data, here we parse or use defaults
      setVType('Car'); 
      setBrand(vehicle.name.split(' ')[0]);
      setCustomBrand('');
      setCustomVType('');
      setModel(vehicle.name.split(' ').slice(1).join(' '));
      setPlate(vehicle.plate);
      setFuel('Petrol');
      setVehicleImage(typeof vehicle.image === 'object' ? vehicle.image.uri : null);
    } else {
      setEditingVehicle(null);
      setVType('');
      setCustomVType('');
      setBrand('');
      setCustomBrand('');
      setModel('');
      setFuel('');
      setPlate('');
      setVehicleImage(null);
    }
    setIsModalVisible(true);
  };

  const handleSave = () => {
    const finalVType = vType === 'Others' ? customVType : vType;
    const finalBrand = brand === 'Other' ? customBrand : brand;

    if (!finalVType || !finalBrand || !model || !plate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? {
        ...v,
        name: `${finalBrand} ${model}`,
        plate: plate,
        image: vehicleImage ? { uri: vehicleImage } : (v.image || DEFAULT_VEHICLE_IMAGE),
      } : v));
    } else {
      const newVehicle: Vehicle = {
        id: Math.random().toString(),
        name: `${finalBrand} ${model}`,
        plate: plate,
        status: 'Up to date',
        lastService: 'New',
        image: vehicleImage ? { uri: vehicleImage } : DEFAULT_VEHICLE_IMAGE,
      };
      setVehicles(prev => [...prev, newVehicle]);
    }
    setIsModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setVehicles(prev => prev.filter(v => v.id !== id))
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerSide} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My vehicles</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.cardMain}>
              <Image source={vehicle.image} style={styles.vehicleImage} />
              <View style={styles.vehicleInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.vehicleName} numberOfLines={1}>{vehicle.name}</Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: vehicle.status === 'Up to date' ? '#ECFDF5' : '#FEF2F2' }
                  ]}>
                    <View style={[
                      styles.statusDot, 
                      { backgroundColor: vehicle.status === 'Up to date' ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={[
                      styles.statusText, 
                      { color: vehicle.status === 'Up to date' ? '#059669' : '#DC2626' }
                    ]}>{vehicle.status}</Text>
                  </View>
                </View>
                <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                
                <View style={styles.serviceInfoRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.lastServiceText}>Last: {vehicle.lastService}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity 
                style={styles.detailsBtn} 
                onPress={() => router.push(`/vehicle-details/${vehicle.id}`)}
              >
                <Text style={styles.detailsBtnText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.actionGroup}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openModal(vehicle)}>
                  <Ionicons name="create-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(vehicle.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={36} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            <AppDropdown
              label="Vehicle Type"
              placeholder="Select Type"
              value={vType}
              options={vehicleTypes}
              onSelect={(val) => {
                setVType(val);
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
              placeholder="Select Brand"
              value={brand}
              options={brandMap[vType] || ['Other']}
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

            <AppDropdown
              label="Fuel Type ⚡"
              placeholder="Select Fuel Type"
              value={fuel}
              options={fuelTypes}
              onSelect={setFuel}
            />

            <AppInput
              label="License Number"
              placeholder="e.g. ABC 1234"
              value={plate}
              onChangeText={setPlate}
              autoCapitalize="characters"
            />

            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickVehicleImage}>
              {vehicleImage ? (
                <Image
                  source={{ uri: vehicleImage }}
                  style={styles.uploadedImage}
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
                  <Text style={styles.imagePlaceholderText}>Upload Vehicle Image</Text>
                </>
              )}
            </TouchableOpacity>

            <AppButton
              label={editingVehicle ? "Update Vehicle" : "Add Vehicle"}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: -2, // Optical alignment
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  serviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastServiceText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 4,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#E84E0F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  modalForm: {
    padding: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  saveBtn: {
    marginTop: 10,
    marginBottom: 40,
  },
});
