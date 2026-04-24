import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [fuel, setFuel] = useState('');
  const [plate, setPlate] = useState('');

  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      // In a real app we'd have full data, here we parse or use defaults
      setVType('Car'); 
      setBrand(vehicle.name.split(' ')[0]);
      setModel(vehicle.name.split(' ').slice(1).join(' '));
      setPlate(vehicle.plate);
      setFuel('Petrol');
    } else {
      setEditingVehicle(null);
      setVType('');
      setBrand('');
      setModel('');
      setFuel('');
      setPlate('');
    }
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!vType || !brand || !model || !plate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? {
        ...v,
        name: `${brand} ${model}`,
        plate: plate,
      } : v));
    } else {
      const newVehicle: Vehicle = {
        id: Math.random().toString(),
        name: `${brand} ${model}`,
        plate: plate,
        status: 'Up to date',
        lastService: 'New',
        image: DEFAULT_VEHICLE_IMAGE,
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
          onPress={() => router.push('/')}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.card}>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => router.push(`/vehicle-details/${vehicle.id}`)}
            >
              <Image source={vehicle.image} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
                <Text style={styles.serviceDate}>Last Service Date - {vehicle.lastService}</Text>
                <View style={styles.divider} />
              </View>
            </TouchableOpacity>

            <View style={[styles.cardContent, { paddingTop: 0, paddingBottom: 20 }]}>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(vehicle)}>
                  <Ionicons name="create-outline" size={22} color="#000" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(vehicle.id)}>
                  <Ionicons name="trash-outline" size={22} color="#000" />
                  <Text style={styles.actionText}>Delete</Text>
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
              onSelect={setVType}
            />

            <AppDropdown
              label="Brand"
              placeholder="Select Brand"
              value={brand}
              options={brandMap[vType] || ['Other']}
              onSelect={setBrand}
            />

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

            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Upload Vehicle Image</Text>
            </View>

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
    paddingTop: 30,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 20,
  },
  vehicleName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  serviceDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
  saveBtn: {
    marginTop: 10,
    marginBottom: 40,
  },
});
