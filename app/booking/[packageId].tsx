import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SERVICE_CENTERS, MOCK_VEHICLES, ServiceCenter, ServicePackage } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  time: string;
  status: 'Available' | 'Busy' | 'Selected';
}

const MORNING_SLOTS: TimeSlot[] = [
  { id: 'm1', time: '08:00 AM', status: 'Available' },
  { id: 'm2', time: '09:00 AM', status: 'Available' },
  { id: 'm3', time: '10:00 AM', status: 'Busy' },
  { id: 'm4', time: '11:00 AM', status: 'Available' },
];

const AFTERNOON_SLOTS: TimeSlot[] = [
  { id: 'a1', time: '12:00 PM', status: 'Available' },
  { id: 'a2', time: '02:00 PM', status: 'Busy' },
  { id: 'a3', time: '04:00 PM', status: 'Available' },
];

const EVENING_SLOTS: TimeSlot[] = [
  { id: 'e1', time: '06:00 PM', status: 'Available' },
  { id: 'e2', time: '07:00 PM', status: 'Available' },
];

export default function BookServiceScreen() {
  const { id, packageId } = useLocalSearchParams();
  const router = useRouter();

  const center = MOCK_SERVICE_CENTERS.find(c => c.id === id);
  const pkg = center?.packages.find(p => p.id === packageId);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(MOCK_VEHICLES[0]?.id || null);

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
    if (isReady && selectedDate) {
      const allSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS, ...EVENING_SLOTS];
      const timeStr = allSlots.find(t => t.id === selectedTime)?.time || '';
      
      router.push({
        pathname: '/payment',
        params: {
          id: center.id,
          packageId: pkg.id,
          date: selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: timeStr,
          vehicleId: selectedVehicle
        }
      });
    }
  };

  const renderDate = (date: Date) => {
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const day = date.getDate();
    const weekDay = date.toLocaleString('default', { weekday: 'narrow' });
    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <TouchableOpacity 
        key={date.toISOString()}
        onPress={() => setSelectedDate(isSelected ? null : date)}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
      >
        <Text style={[styles.weekDayText, isSelected && styles.dateTextSelected]}>{weekDay}</Text>
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day}</Text>
        {isToday && !isSelected && <Text style={styles.todayLabel}>TODAY</Text>}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: TimeSlot) => {
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
        <Text style={[styles.timeSlotTime, isSelected && styles.timeSlotTextSelected, isBusy && styles.timeSlotTextBusy]}>
          {slot.time}
        </Text>
        <Text style={[
          styles.timeSlotStatus, 
          isBusy ? styles.statusBusy : styles.statusAvailable,
          isSelected && styles.statusSelected
        ]}>
          {isSelected ? 'Selected' : slot.status}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Schedule</Text>
          <Text style={styles.headerSubtitle}>{center.name}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
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

          {/* Disclaimer */}
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
          
          {/* 1. SELECT VEHICLE (Now at top) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>SELECT VEHICLE</Text>
              <TouchableOpacity>
                <Text style={styles.addNewText}>+ Add New</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
              {MOCK_VEHICLES.map((vehicle) => {
                const isSelected = selectedVehicle === vehicle.id;
                return (
                  <TouchableOpacity 
                    key={vehicle.id}
                    onPress={() => setSelectedVehicle(isSelected ? null : vehicle.id)}
                    style={styles.vehicleItemContainer}
                  >
                    <View style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}>
                      <Image source={vehicle.image} style={styles.vehicleImage} />
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.vehicleNameText, isSelected && styles.vehicleNameTextSelected]}>
                      {vehicle.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 2. SELECT DATE (Month-style header) */}
          <View style={styles.section}>
            <View style={styles.calendarHeader}>
              <Ionicons name="chevron-back" size={20} color="#E84E0F" />
              <Text style={styles.calendarMonth}>October 2023</Text>
              <Ionicons name="chevron-forward" size={20} color="#E84E0F" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
              {dates.map(renderDate)}
            </ScrollView>
          </View>

          {/* 3. SELECT TIME (Categorized) */}
          
          {/* Morning */}
          <View style={styles.section}>
            <View style={styles.timeCategoryHeader}>
              <View style={styles.timeCategoryTitleRow}>
                <Ionicons name="sunny-outline" size={20} color="#E84E0F" />
                <Text style={styles.timeCategoryName}>Morning</Text>
              </View>
              <Text style={styles.timeRangeText}>08:00 - 11:59</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {MORNING_SLOTS.map(renderTimeSlot)}
            </View>
          </View>

          {/* Afternoon */}
          <View style={styles.section}>
            <View style={styles.timeCategoryHeader}>
              <View style={styles.timeCategoryTitleRow}>
                <Ionicons name="sunny" size={20} color="#E84E0F" />
                <Text style={styles.timeCategoryName}>Afternoon</Text>
              </View>
              <Text style={styles.timeRangeText}>12:00 - 16:59</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {AFTERNOON_SLOTS.map(renderTimeSlot)}
            </View>
          </View>

          {/* Evening */}
          <View style={styles.section}>
            <View style={styles.timeCategoryHeader}>
              <View style={styles.timeCategoryTitleRow}>
                <Ionicons name="moon-outline" size={20} color="#E84E0F" />
                <Text style={styles.timeCategoryName}>Evening</Text>
              </View>
              <Text style={styles.timeRangeText}>17:00 - 20:00</Text>
            </View>
            <View style={styles.timeSlotsGrid}>
              {EVENING_SLOTS.map(renderTimeSlot)}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>ESTIMATED TOTAL</Text>
          <Text style={styles.totalValue}>LKR {pkg.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.proceedButton, !isReady && styles.proceedButtonDisabled]} 
          onPress={handleProceed}
          disabled={!isReady}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
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
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  infoButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  addNewText: {
    fontSize: 14,
    color: '#E84E0F',
    fontWeight: '800',
  },
  vehicleScroll: {
    flexDirection: 'row',
  },
  vehicleItemContainer: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  vehicleCard: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: '#E84E0F',
    backgroundColor: '#fff',
  },
  vehicleImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E84E0F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  vehicleNameText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
    textAlign: 'center',
  },
  vehicleNameTextSelected: {
    color: '#E84E0F',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginHorizontal: 40,
  },
  datePickerScroll: {
    paddingRight: 20,
  },
  dateItem: {
    width: 50,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginRight: 15,
    backgroundColor: '#fff',
  },
  dateItemSelected: {
    backgroundColor: '#E84E0F',
    elevation: 8,
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  todayLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#E84E0F',
    marginTop: 2,
  },
  dateTextSelected: {
    color: '#fff',
  },
  timeCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeCategoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeCategoryName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginLeft: 10,
  },
  timeRangeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: (width - 55) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 15,
  },
  timeSlotSelected: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  timeSlotStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusAvailable: {
    color: '#10B981',
  },
  statusBusy: {
    color: '#EF4444',
  },
  statusSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  timeSlotTextBusy: {
    color: '#9CA3AF',
  },
  timeSlotBusy: {
    backgroundColor: '#F9FAFB',
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
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
  },
  priceContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E84E0F',
  },
  proceedButton: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  proceedButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
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
});
