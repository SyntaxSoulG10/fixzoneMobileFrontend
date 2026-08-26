import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Dimensions, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth_context';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { getVehicleIcon } from '../../utils/vehicle_utils';
import { formatTimeToBackend } from '../../utils/date_utils';

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

export default function BookServiceScreen() {
  const { id, packageId, packageName, packagePrice } = useLocalSearchParams<{ id?: string; packageId?: string; packageName?: string; packagePrice?: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();

  const handleBack = () => {
    const targetId = id || (center as any)?.id || (center as any)?.centerId;
    if (targetId) {
      router.replace({
        pathname: '/service-center/[id]',
        params: { id: targetId, from: 'book' }
      });
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/book');
    }
  };

  const [center, setCenter] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedVehicle(null);
    }, [])
  );

  const formatSlotTime = (time: string) => {
    const [timePart, ampm] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hoursNum = parseInt(hours);
    if (ampm === 'PM' && hoursNum !== 12) hoursNum += 12;
    if (ampm === 'AM' && hoursNum === 12) hoursNum = 0;
    return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
  };

  const isSlotAvailable = useCallback((timeStr: string) => {
    if (!selectedDate) return true;
    const backendFormat = formatSlotTime(timeStr);
    return availableSlots.some(s => s === timeStr || s.startsWith(backendFormat));
  }, [availableSlots, selectedDate]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!id || !selectedDate) return;
      try {
        setIsLoadingSlots(true);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const slots = await bookingService.getAvailableSlots(id as string, dateStr, packageId as string);
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Failed to fetch available slots in package booking:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, id, packageId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (authUser?.userId) {
          const userVehicles = await vehicleService.getVehiclesByUser(authUser.userId);
          setVehicles(userVehicles);
        }

        // Use passed params
        setCenter({ id, name: "FixZone Service Center" });
        setPkg({
          id: packageId,
          name: packageName || "Selected Package",
          price: Number(packagePrice) || 0,
          features: ["Full Inspection", "Professional Care", "Quality Guaranteed"]
        });

      } catch (e) {
        console.error('Error fetching booking data', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, packageId, authUser?.userId]);

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

  const isReady = selectedDate && selectedTime && selectedVehicle;

  const handleProceed = () => {
    if (isReady && selectedDate && selectedTime) {
      const timeStr = formatTimeToBackend(selectedTime);
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicle);

      router.push({
        pathname: '/payment',
        params: {
          id: center.id,
          packageId: pkg.id,
          date: dateStr,
          time: timeStr,
          vehicleId: selectedVehicle,
          vehicleName: selectedVehicleObj ? `${selectedVehicleObj.brand} ${selectedVehicleObj.model}` : 'Your Vehicle',
          vehiclePlate: selectedVehicleObj?.plateNumber || ''
        }
      });
    }
  };

  const renderDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isLeaveDate = center?.leaveDates?.includes(dateStr);
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const day = date.getDate();
    const weekDay = date.toLocaleString('default', { weekday: 'narrow' });
    const isToday = new Date().toDateString() === date.toDateString();

    return (
      <TouchableOpacity
        key={date.toISOString()}
        disabled={isLeaveDate}
        onPress={() => {
          setSelectedDate(isSelected ? null : date);
          setSelectedTime(null);
        }}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isLeaveDate && styles.dateItemDisabled
        ]}
      >
        <Text style={[
          styles.weekDayText,
          isSelected && styles.dateTextSelected,
          isLeaveDate && styles.textDisabled
        ]}>{weekDay}</Text>
        <Text style={[
          styles.dateText,
          isSelected && styles.dateTextSelected,
          isLeaveDate && styles.textDisabled
        ]}>{day}</Text>
        {isLeaveDate ? (
          <Text style={styles.closedLabel}>CLOSED</Text>
        ) : (
          isToday && !isSelected && <Text style={styles.todayLabel}>TODAY</Text>
        )}
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

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#E84E0F" />
      </View>
    );
  }

  if (!center || !pkg) {
    return (
      <View style={styles.container}>
        <Text>Booking information not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Schedule</Text>
          <Text style={styles.headerSubtitle}>{center.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
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
                  <Text style={styles.packagePriceLabel}>Estimated price</Text>
                  <Text style={styles.packagePriceValue}>LKR {pkg.price.toLocaleString()}</Text>
                </View>
                {pkg.features.map((f: string, i: number) => (
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
                  </Text>
                  <Text style={[styles.disclaimerText, { marginTop: 4 }]}>
                    Note: You have to pay 10% for booking.
                  </Text>
                </View>
              </View>

              {/* 1. SELECT VEHICLE */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>SELECT YOUR VEHICLE</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/vehicles')}>
                    <Text style={styles.addNewText}>+ Add New</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleScroll}>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle) => {
                      const isSelected = selectedVehicle === vehicle.id;
                      return (
                        <TouchableOpacity
                          key={vehicle.id}
                          onPress={() => setSelectedVehicle(isSelected ? null : vehicle.id)}
                          style={styles.vehicleItemContainer}
                        >
                          <View style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}>
                            {vehicle.imageUrl ? (
                              <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} />
                            ) : (
                              <Ionicons name={getVehicleIcon(vehicle.vehicleType)} size={40} color={isSelected ? "#E84E0F" : "#9CA3AF"} />
                            )}
                            {isSelected && (
                              <View style={styles.checkBadge}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                              </View>
                            )}
                          </View>
                          <Text numberOfLines={1} style={[styles.vehicleNameText, isSelected && styles.vehicleNameTextSelected]}>
                            {vehicle.brand}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <TouchableOpacity style={styles.emptyVehicleBtn} onPress={() => router.push('/(tabs)/vehicles')}>
                      <Text style={styles.emptyVehicleText}>No vehicles found. Tap to add one.</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              {/* 2. SELECT DATE */}
              <View style={styles.section}>
                <View style={styles.calendarHeader}>
                  <Text style={styles.calendarMonth}>Select Date</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
                  {dates.map(renderDate)}
                </ScrollView>
              </View>

              {/* 3. SELECT TIME */}
              <View style={styles.section}>
                <View style={styles.timeCategoryHeader}>
                  <Text style={styles.timeCategoryName}>Select Time</Text>
                </View>

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
                    <Text style={styles.slotEmptyText}>No available slots for this package on the selected date. Please choose another date.</Text>
                  </View>
                ) : (
                  <>
                    {morningSlots.length > 0 && (
                      <>
                        <Text style={styles.timeSubHeader}>Morning</Text>
                        <View style={styles.timeSlotsGrid}>
                          {morningSlots.map(renderDynamicSlot)}
                        </View>
                      </>
                    )}

                    {afternoonSlots.length > 0 && (
                      <>
                        <Text style={styles.timeSubHeader}>Afternoon</Text>
                        <View style={styles.timeSlotsGrid}>
                          {afternoonSlots.map(renderDynamicSlot)}
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>LKR {pkg.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedButton, !isReady && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!isReady}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: -2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
  },
  scrollContent: { paddingBottom: 120 },
  section: { paddingHorizontal: 20, marginTop: 14 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  addNewText: { fontSize: 14, color: '#E84E0F', fontWeight: '800' },
  vehicleScroll: { flexDirection: 'row' },
  vehicleItemContainer: { alignItems: 'center', marginRight: 20, width: 80 },
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
  },
  vehicleCardSelected: { borderColor: '#E84E0F', backgroundColor: '#fff' },
  vehicleImage: { width: 60, height: 60, resizeMode: 'contain', borderRadius: 10 },
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
  vehicleNameText: { fontSize: 11, color: '#9CA3AF', fontWeight: '700', textAlign: 'center' },
  vehicleNameTextSelected: { color: '#E84E0F' },
  calendarHeader: { marginBottom: 15 },
  calendarMonth: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 15 },
  datePickerScroll: { paddingRight: 20 },
  dateItem: { width: 50, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 15, marginRight: 15, backgroundColor: '#F9FAFB' },
  dateItemSelected: { backgroundColor: '#E84E0F' },
  weekDayText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  dateText: { fontSize: 20, fontWeight: '900', color: '#111827' },
  todayLabel: { fontSize: 8, fontWeight: '800', color: '#E84E0F', marginTop: 2 },
  dateTextSelected: { color: '#fff' },
  dateItemDisabled: { backgroundColor: '#F3F4F6', opacity: 0.6 },
  textDisabled: { color: '#D1D5DB' },
  closedLabel: { fontSize: 8, fontWeight: '800', color: '#EF4444', marginTop: 4 },
  timeCategoryHeader: { marginBottom: 15 },
  timeCategoryName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 15 },
  timeSubHeader: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginTop: 15, marginBottom: 10 },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot: { width: (width - 55) / 2, padding: 16, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 15 },
  timeSlotSelected: { backgroundColor: '#E84E0F', borderColor: '#E84E0F' },
  timeSlotTime: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  timeSlotStatus: { fontSize: 12, fontWeight: '700' },
  statusAvailable: { color: '#10B981' },
  statusBusy: { color: '#EF4444' },
  statusSelected: { color: 'rgba(255,255,255,0.8)' },
  timeSlotTextSelected: { color: '#fff' },
  timeSlotTextBusy: { color: '#9CA3AF' },
  timeSlotBusy: { backgroundColor: '#F9FAFB', opacity: 0.5 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: Platform.OS === 'ios' ? 35 : 20 },
  priceContainer: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '800' },
  totalValue: { fontSize: 22, fontWeight: '900', color: '#E84E0F' },
  proceedButton: { backgroundColor: '#E84E0F', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 16 },
  proceedButtonDisabled: { backgroundColor: '#F3F4F6' },
  proceedButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  packageSelectedCard: { marginHorizontal: 20, marginTop: 10, padding: 16, borderWidth: 1, borderColor: '#E84E0F', borderRadius: 16, backgroundColor: '#FFF7ED' },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  packageName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  selectedBadge: { backgroundColor: '#E84E0F', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  selectedBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  packagePriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  packagePriceLabel: { fontSize: 13, fontWeight: '700', color: '#111827' },
  packagePriceValue: { fontSize: 18, fontWeight: '900', color: '#E84E0F' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 13, color: '#374151', fontWeight: '600', marginLeft: 8 },
  disclaimerContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, alignItems: 'flex-start' },
  disclaimerText: { fontSize: 11, color: '#E84E0F', fontWeight: '700', marginLeft: 8, flex: 1 },
  emptyVehicleBtn: { padding: 20, backgroundColor: '#F9FAFB', borderRadius: 16, width: width - 40, alignItems: 'center' },
  emptyVehicleText: { color: '#6B7280', fontWeight: '700' },
  slotInfoBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  slotInfoText: { marginLeft: 10, color: '#6B7280', fontWeight: '600', fontSize: 13, flex: 1 },
  slotLoadingBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF7ED', borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  slotLoadingText: { marginLeft: 10, color: '#E84E0F', fontWeight: '700', fontSize: 13 },
  slotEmptyBox: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FEE2E2' },
  slotEmptyText: { marginLeft: 10, color: '#EF4444', fontWeight: '700', fontSize: 13, flex: 1 },
});
