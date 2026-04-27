import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SERVICE_CENTERS, MOCK_VEHICLES, Booking } from '../../constants/mock_data';
import { useBookings } from '../../context/BookingContext';

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

export default function RescheduleScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { bookings, rescheduleBooking } = useBookings();

  const booking = bookings.find(b => b.id === bookingId);
  const center = MOCK_SERVICE_CENTERS.find(c => c.id === booking?.centerId);
  const pkg = center?.packages.find(p => p.id === booking?.packageId);
  const vehicle = MOCK_VEHICLES.find(v => v.id === booking?.vehicleId);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dates = useMemo(() => {
    const arr = [];
    const today = new Date();
    // Rescheduling rules often require a future date (at least 3 days from now as per user prompt logic)
    // For prototype, we'll just show the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      arr.push(date);
    }
    return arr;
  }, []);

  if (!booking || !center || !pkg || !vehicle) {
    return (
      <View style={styles.container}>
        <Text>Booking information not found</Text>
      </View>
    );
  }

  const isReady = selectedDate && selectedTime;

  const handleConfirmReschedule = () => {
    if (isReady && selectedDate) {
      const allSlots = [...MORNING_SLOTS, ...AFTERNOON_SLOTS, ...EVENING_SLOTS];
      const timeStr = allSlots.find(t => t.id === selectedTime)?.time || '';
      
      const newDateStr = selectedDate.getDate().toString();
      const newMonthStr = selectedDate.toLocaleString('default', { month: 'short' });
      const newYearStr = selectedDate.getFullYear().toString();

      rescheduleBooking(booking.id, newDateStr, newMonthStr, newYearStr, timeStr);
      
      Alert.alert('Success', 'Your booking has been rescheduled.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
  };

  const renderDate = (date: Date) => {
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const day = date.getDate();
    const weekDay = date.toLocaleString('default', { weekday: 'narrow' });

    return (
      <TouchableOpacity 
        key={date.toISOString()}
        onPress={() => setSelectedDate(date)}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
      >
        <Text style={[styles.weekDayText, isSelected && styles.dateTextSelected]}>{weekDay}</Text>
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day}</Text>
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
        onPress={() => setSelectedTime(slot.id)}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reschedule Booking</Text>
          <Text style={styles.headerSubtitle}>{center.name}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Booking Summary (Read Only) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="car" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>{vehicle.name} • {vehicle.plate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="construct" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>{pkg.name}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="time" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>Current: {booking.month} {booking.date} at {booking.time}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT NEW DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
            {dates.map(renderDate)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SELECT NEW TIME</Text>
          
          <Text style={styles.timeCategoryLabel}>Morning</Text>
          <View style={styles.timeSlotsGrid}>
            {MORNING_SLOTS.map(renderTimeSlot)}
          </View>

          <Text style={styles.timeCategoryLabel}>Afternoon</Text>
          <View style={styles.timeSlotsGrid}>
            {AFTERNOON_SLOTS.map(renderTimeSlot)}
          </View>

          <Text style={styles.timeCategoryLabel}>Evening</Text>
          <View style={styles.timeSlotsGrid}>
            {EVENING_SLOTS.map(renderTimeSlot)}
          </View>
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.proceedButton, !isReady && styles.proceedButtonDisabled]} 
          onPress={handleConfirmReschedule}
          disabled={!isReady}
        >
          <Text style={styles.proceedButtonText}>Confirm Reschedule</Text>
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
  scrollContent: {
    paddingBottom: 120,
  },
  summaryCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 16,
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
    backgroundColor: '#F3F4F6',
  },
  dateItemSelected: {
    backgroundColor: '#E84E0F',
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
  dateTextSelected: {
    color: '#fff',
  },
  timeCategoryLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 40,
  },
  proceedButton: {
    backgroundColor: '#E84E0F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
