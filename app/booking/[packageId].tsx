import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SERVICE_CENTERS, MOCK_VEHICLES, ServiceCenter, ServicePackage } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

const TIME_SLOTS = [
  { id: '1', time: '8.00 AM', status: 'Available' },
  { id: '2', time: '10.00 AM', status: 'Busy' },
  { id: '3', time: '12.00 PM', status: 'Available' },
  { id: '4', time: '2.00 PM', status: 'Busy' },
  { id: '5', time: '4.00 PM', status: 'Available' },
  { id: '6', time: '6.00 PM', status: 'Available' },
];

export default function BookServiceScreen() {
  const { id, packageId } = useLocalSearchParams();
  const router = useRouter();

  // Find center and package
  const center = MOCK_SERVICE_CENTERS.find(c => c.id === id);
  const pkg = center?.packages.find(p => p.id === packageId);

  // States
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(MOCK_VEHICLES[0]?.id || null);
  const [specialRequest, setSpecialRequest] = useState('');

  // Generate 30 dates starting from today
  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      arr.push(date);
    }
    return arr;
  }, []);

  if (!center || !pkg) {
    return (
      <View style={styles.container}>
        <Text>Booking information not found</Text>
      </View>
    );
  }

  const isReady = selectedDate && selectedTime && selectedVehicle;

  const handleProceed = () => {
    if (isReady) {
      // Navigate to payment or confirmation
      console.log('Proceeding with booking:', {
        centerId: center.id,
        packageId: pkg.id,
        date: selectedDate,
        time: selectedTime,
        vehicleId: selectedVehicle,
        notes: specialRequest
      });
      // router.push('/payment');
    }
  };

  const renderDate = (date: Date) => {
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const weekDay = date.toLocaleString('default', { weekday: 'short' });

    return (
      <TouchableOpacity 
        key={date.toISOString()}
        onPress={() => setSelectedDate(isSelected ? null : date)}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
      >
        <Text style={[styles.weekDayText, isSelected && styles.dateTextSelected]}>{weekDay}</Text>
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day}</Text>
        <Text style={[styles.monthText, isSelected && styles.dateTextSelected]}>{month}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Service Center Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Center</Text>
            <View style={styles.centerSummary}>
              <Image source={center.image} style={styles.centerImage} />
              <View style={styles.centerInfo}>
                <Text style={styles.centerName}>{center.name}</Text>
                <Text style={styles.centerLocation}>{center.location}</Text>
                <Text style={styles.centerDistance}>{center.distance} away</Text>
              </View>
            </View>
          </View>

          {/* Selected Package */}
          <View style={styles.packageSelectedCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Selected</Text>
              </View>
            </View>
            <View style={styles.packagePriceRow}>
              <Text style={styles.packagePriceLabel}>Estimated time & price</Text>
              <Text style={styles.packagePriceValue}>LKR {pkg.price.toLocaleString()}</Text>
            </View>
            {pkg.features.slice(0, 3).map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.disclaimerContainer}>
            <Ionicons name="information-circle-outline" size={24} color="#E84E0F" />
            <View style={{ flex: 1 }}>
              <Text style={styles.disclaimerText}>
                Disclaimer: Prices are estimates. Final cost may change after inspection. 
                Customer approval required for extra work.
              </Text>
              <Text style={[styles.disclaimerText, { marginTop: 4 }]}>
                Note: You have to pay 10% for booking. When completion you can handover the rest.
              </Text>
            </View>
          </View>

          {/* Select Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
              {dates.map(renderDate)}
            </ScrollView>
          </View>

          {/* Select Time */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              <Text style={styles.slotsOpenText}>4 Slots Open</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {TIME_SLOTS.map((slot) => {
                const isBusy = slot.status === 'Busy';
                const isSelected = selectedTime === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    disabled={isBusy}
                    onPress={() => setSelectedTime(isSelected ? null : slot.id)}
                    style={[
                      styles.timeSlot,
                      isBusy && styles.timeSlotBusy,
                      isSelected && styles.timeSlotSelected
                    ]}
                  >
                    <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>{slot.time}</Text>
                    <Text style={[
                      styles.timeSlotStatus, 
                      isBusy ? styles.statusBusy : styles.statusAvailable,
                      isSelected && styles.statusSelected
                    ]}>
                      Line 1-{slot.status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Select Vehicle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {MOCK_VEHICLES.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <TouchableOpacity 
                    key={vehicle.id}
                    onPress={() => setSelectedVehicle(isSelected ? null : vehicle.id)}
                    style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                  >
                    <Image source={vehicle.image} style={styles.vehicleImage} />
                    <Text style={[styles.vehiclePlate, isSelected && styles.vehiclePlateSelected]}>{vehicle.plate.split(' ').pop()}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.addVehicleCard}>
                <Ionicons name="add" size={24} color="#6B7280" />
                <Text style={styles.addVehicleText}>Add</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Special Request */}
          <View style={[styles.section, { marginBottom: 120 }]}>
            <Text style={styles.sectionTitle}>Special Request</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe any specific issues (e.g. 'Strange noise from rear left tire' )...."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={specialRequest}
              onChangeText={setSpecialRequest}
              maxLength={200}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.totalValue}>LKR {pkg.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.proceedButton, !isReady && styles.proceedButtonDisabled]} 
          onPress={handleProceed}
          disabled={!isReady}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  centerSummary: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 12,
  },
  centerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  centerInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  centerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  centerLocation: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  centerDistance: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  packageSelectedCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E84E0F',
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  selectedBadge: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  packagePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packagePriceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  packagePriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E84E0F',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  dateItem: {
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayHeaderText: {
    width: (width - 72) / 7,
    textAlign: 'center',
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '800',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateItemSelected: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginVertical: 2,
  },
  monthText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateTextSelected: {
    color: '#fff',
  },
  datePickerScroll: {
    paddingRight: 20,
  },
  slotsOpenText: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: (width - 50) / 3,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    marginBottom: 12,
  },
  timeSlotBusy: {
    borderColor: '#EF4444',
  },
  timeSlotSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#E84E0F',
    borderWidth: 2,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  timeSlotTextSelected: {
    color: '#E84E0F',
  },
  timeSlotStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusAvailable: {
    color: '#10B981',
  },
  statusBusy: {
    color: '#EF4444',
  },
  statusSelected: {
    color: '#E84E0F',
  },
  vehicleScroll: {
    paddingVertical: 4,
  },
  vehicleCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: '#E84E0F',
    backgroundColor: '#FFF7ED',
  },
  vehicleImage: {
    width: '100%',
    height: 60,
    resizeMode: 'cover',
  },
  vehiclePlate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  vehiclePlateSelected: {
    color: '#E84E0F',
  },
  addVehicleCard: {
    width: 60,
    height: 100,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVehicleText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E84E0F',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  proceedButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 8,
  },
});
