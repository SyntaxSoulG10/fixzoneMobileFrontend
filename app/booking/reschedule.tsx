import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookings } from '../../context/BookingContext';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/auth_context';

const { width } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  time: string;
  status: 'Available' | 'Busy' | 'Selected';
}

const MORNING_SLOTS: TimeSlot[] = [
  { id: 'm1', time: '08:00 AM', status: 'Available' },
  { id: 'm2', time: '09:00 AM', status: 'Available' },
  { id: 'm3', time: '10:00 AM', status: 'Available' },
  { id: 'm4', time: '11:00 AM', status: 'Available' },
];

const AFTERNOON_SLOTS: TimeSlot[] = [
  { id: 'a1', time: '01:00 PM', status: 'Available' },
  { id: 'a2', time: '02:00 PM', status: 'Available' },
  { id: 'a3', time: '03:00 PM', status: 'Available' },
  { id: 'a4', time: '04:00 PM', status: 'Available' },
  { id: 'a5', time: '05:00 PM', status: 'Available' },
];

const EVENING_SLOTS: TimeSlot[] = [];

export default function RescheduleScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { bookings, rescheduleBooking } = useBookings();
  const { user: authUser } = useAuth();

  const booking = bookings.find(b => b.bookingId === bookingId);
  const [userVehicles, setUserVehicles] = useState<VehicleResponse[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchVehicles = async () => {
      if (!authUser?.userId) return;
      try {
        const data = await vehicleService.getVehiclesByUser(authUser.userId);
        setUserVehicles(data);
      } catch (e) {
        console.error('Failed to fetch vehicles in reschedule', e);
      }
    };
    fetchVehicles();
  }, [authUser?.userId]);

  const vehicle = userVehicles.find(v => v.id === booking?.vehicleId);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Helper to format "08:00 AM" to "08:00" for backend checking
  const formatSlotTime = (time: string) => {
    const [timePart, ampm] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hoursNum = parseInt(hours);
    if (ampm === 'PM' && hoursNum !== 12) hoursNum += 12;
    if (ampm === 'AM' && hoursNum === 12) hoursNum = 0;
    return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
  };

  const isSlotAvailable = useCallback((timeStr: string) => {
    if (!booking || !selectedDate) return true;
    const backendFormat = formatSlotTime(timeStr);

    // If selected date and slot match current booking, allow it
    const isSameDate = selectedDate.toISOString().split('T')[0] === booking.bookingDate;
    const isSameTime = booking.bookingTime && booking.bookingTime.startsWith(backendFormat);
    if (isSameDate && isSameTime) return true;

    // Check if slot starts with backend format e.g. "08:00-09:00" or exact match
    return availableSlots.some(s => s === timeStr || s.startsWith(backendFormat));
  }, [availableSlots, booking, selectedDate]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!booking?.centerId || !selectedDate) return;
      try {
        setIsLoadingSlots(true);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const slots = await bookingService.getAvailableSlots(booking.centerId, dateStr, booking.packageId);
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Failed to fetch available slots in reschedule:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, booking?.centerId, booking?.packageId]);

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userSubOrTrialEnd = (authUser as any)?.subscriptionEndsAt || (authUser as any)?.trialEndsAt;
    let maxAllowedDate: Date;

    if (userSubOrTrialEnd) {
      maxAllowedDate = new Date(userSubOrTrialEnd);
      maxAllowedDate.setHours(23, 59, 59, 999);
    } else {
      maxAllowedDate = new Date(today);
      maxAllowedDate.setDate(today.getDate() + 30);
      maxAllowedDate.setHours(23, 59, 59, 999);
    }

    let current = new Date(today);
    while (arr.length < 20 && current <= maxAllowedDate) {
      arr.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return arr;
  }, [authUser]);

  const morningSlots = useMemo(() => {
    return availableSlots.filter(s => s.toUpperCase().includes('AM'));
  }, [availableSlots]);

  const afternoonSlots = useMemo(() => {
    return availableSlots.filter(s => s.toUpperCase().includes('PM'));
  }, [availableSlots]);

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text>Booking information not found</Text>
      </View>
    );
  }

  const isReady = selectedDate && selectedTime;

  const handleConfirmReschedule = async () => {
    if (isReady && selectedDate && selectedTime) {
      const newDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const newTimeStr = `${formatSlotTime(selectedTime)}:00`;

      try {
        await rescheduleBooking(booking.bookingId, newDateStr, newTimeStr);
        Alert.alert('Success', 'Your booking has been rescheduled successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (e: any) {
        Alert.alert('Cannot Reschedule', e.message || 'Failed to reschedule booking. Please try another time slot.');
      }
    }
  };

  const renderDate = (date: Date) => {
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const day = date.getDate();
    const weekDay = date.toLocaleString('default', { weekday: 'narrow' });

    return (
      <TouchableOpacity
        key={date.toISOString()}
        onPress={() => {
          setSelectedDate(date);
          setSelectedTime(null);
        }}
        style={[styles.dateItem, isSelected && styles.dateItemSelected]}
      >
        <Text style={[styles.weekDayText, isSelected && styles.dateTextSelected]}>{weekDay}</Text>
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day}</Text>
      </TouchableOpacity>
    );
  };

  const renderDynamicSlot = (timeStr: string) => {
    const isSelected = selectedTime === timeStr;
    return (
      <TouchableOpacity
        key={timeStr}
        onPress={() => setSelectedTime(isSelected ? null : timeStr)}
        style={[
          styles.timeSlot,
          isSelected && styles.timeSlotSelected
        ]}
      >
        <Text style={[styles.timeSlotTime, isSelected && styles.timeSlotTextSelected]}>
          {timeStr}
        </Text>
        <Text style={[
          styles.timeSlotStatus,
          styles.statusAvailable,
          isSelected && styles.statusSelected
        ]}>
          {isSelected ? 'Selected' : 'Available'}
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
          <Text style={styles.headerSubtitle}>{booking.serviceCenterName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Booking Summary (Read Only) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="car" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'} • {vehicle?.plateNumber || 'N/A'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="construct" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>{booking.packageName}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="time" size={20} color="#E84E0F" />
            <Text style={styles.summaryText}>Current: {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}</Text>
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

          {!selectedDate ? (
            <View style={styles.slotInfoBox}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.slotInfoText}>Please select a date above to view available time slots.</Text>
            </View>
          ) : isLoadingSlots ? (
            <View style={styles.slotLoadingBox}>
              <ActivityIndicator size="small" color="#E84E0F" />
              <Text style={styles.slotLoadingText}>Checking live availability...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={styles.slotEmptyBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
              <Text style={styles.slotEmptyText}>No available slots for this booking on the selected date. Please choose another date.</Text>
            </View>
          ) : (
            <>
              {morningSlots.length > 0 && (
                <>
                  <Text style={styles.timeCategoryLabel}>Morning</Text>
                  <View style={styles.timeSlotsGrid}>
                    {morningSlots.map(renderDynamicSlot)}
                  </View>
                </>
              )}

              {afternoonSlots.length > 0 && (
                <>
                  <Text style={styles.timeCategoryLabel}>Afternoon</Text>
                  <View style={styles.timeSlotsGrid}>
                    {afternoonSlots.map(renderDynamicSlot)}
                  </View>
                </>
              )}
            </>
          )}
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
  slotInfoBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  slotInfoText: { marginLeft: 10, color: '#6B7280', fontWeight: '600', fontSize: 13, flex: 1 },
  slotLoadingBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF7ED', borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  slotLoadingText: { marginLeft: 10, color: '#E84E0F', fontWeight: '700', fontSize: 13 },
  slotEmptyBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2' },
  slotEmptyText: { marginLeft: 10, color: '#EF4444', fontWeight: '700', fontSize: 13, flex: 1 },
});
