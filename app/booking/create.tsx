import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';
import { bookingService } from '../../services/bookingService';
import { getVehicleIcon, checkVehiclePackageCompatibility } from '../../utils/vehicle_utils';
import { formatTimeToBackend } from '../../utils/date_utils';
import AddVehicleModal from '../../components/booking/AddVehicleModal';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

interface TimeSlot {
  id: string;
  time: string;
  status: 'Available' | 'Busy' | 'Selected';
}

export default function SelectScheduleScreen() {
  const { centerId, packageId, packageName } = useLocalSearchParams<{ centerId: string; packageId: string; packageName: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const handleBack = () => {
    const targetId = centerId || (center as any)?.id || (center as any)?.centerId;
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

  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isAddVehicleVisible, setIsAddVehicleVisible] = useState(false);

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userSubOrTrialEnd = (user as any)?.subscriptionEndsAt || (user as any)?.trialEndsAt;
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
  }, [user]);

  const currentMonthYear = useMemo(() => {
    return (selectedDate || new Date()).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const pkg = useMemo(() => {
    if (!center?.servicePackages) return null;
    return center.servicePackages.find(p => p.packageId === packageId || (p as any).id === packageId);
  }, [center, packageId]);

  useEffect(() => {
    if (centerId && user?.userId) {
      loadData();
    }
  }, [centerId, user?.userId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [centerData, vehicleData] = await Promise.all([
        serviceCenterService.getServiceCenterById(centerId),
        vehicleService.getVehiclesByUser(user!.userId)
      ]);
      setCenter(centerData);
      setVehicles(vehicleData);

      // Update selection: preserve current selection if it exists in new data
      setSelectedVehicle(prev => {
        if (prev && vehicleData.some(v => v.id === prev)) return prev;
        return null; // Don't auto-select the first vehicle
      });
    } catch (err) {
      console.error('Failed to load booking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [centerId, user?.userId]);

  useFocusEffect(
    useCallback(() => {
      // Reset selection state when entering the screen for a fresh experience
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedVehicle(null);
      setAvailableSlots([]);
      loadData();
    }, [loadData])
  );

  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const fetchSlots = useCallback(async () => {
    if (!centerId || !selectedDate) return;
    try {
      setIsLoadingSlots(true);
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const validPkgId = packageId && packageId.trim() !== '' ? packageId : undefined;
      const slots = await bookingService.getAvailableSlots(centerId, dateStr, validPkgId);
      setAvailableSlots(slots);

      if (selectedTime && !slots.includes(selectedTime)) {
        setSelectedTime(null);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [centerId, selectedDate, packageId, selectedTime]);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate, centerId, packageId]);

  const morningSlots = useMemo(() => {
    return availableSlots.filter(s => s.toUpperCase().includes('AM'));
  }, [availableSlots]);

  const afternoonSlots = useMemo(() => {
    return availableSlots.filter(s => s.toUpperCase().includes('PM'));
  }, [availableSlots]);

  const selectedVehicleObj = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicle);
  }, [vehicles, selectedVehicle]);

  const compatibility = useMemo(() => {
    if (!selectedVehicleObj || !pkg) return { isCompatible: true, typeMatch: true, brandMatch: true };
    return checkVehiclePackageCompatibility(selectedVehicleObj, pkg);
  }, [selectedVehicleObj, pkg]);

  const isReady = selectedDate && selectedTime && selectedVehicle && compatibility.isCompatible;

  const handleProceed = async () => {
    if (!selectedVehicle) {
      Alert.alert('Selection Required', 'Please select a vehicle first.');
      return;
    }
    if (!compatibility.isCompatible) {
      Alert.alert('Incompatible Vehicle', compatibility.reason || 'Selected vehicle is incompatible with this package.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Selection Required', 'Please select a date.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Selection Required', 'Please select a time slot.');
      return;
    }

    try {
      setIsProcessing(true);
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const timeStr = formatTimeToBackend(selectedTime);

      const booking = await bookingService.createBooking({
        centerId: centerId!,
        packageId: packageId!,
        vehicleId: selectedVehicle,
        bookingDate: dateStr,
        bookingTime: timeStr,
        customerId: user!.userId,
      });

      // Proceed to payment with the newly created (soft-locked) booking
      const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicle);

      router.push({
        pathname: '/payment',
        params: {
          bookingId: booking.bookingId,
          id: centerId,
          packageId: packageId,
          date: dateStr,
          time: selectedTime,
          vehicleId: selectedVehicle,
          centerName: center?.name,
          packageName: pkg?.name,
          price: price.toString(),
          vehicleName: selectedVehicleObj ? `${selectedVehicleObj.brand} ${selectedVehicleObj.model}` : 'Your Vehicle',
          vehiclePlate: selectedVehicleObj?.plateNumber || ''
        }
      });
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to create booking. The slot might have just been taken.');
      fetchSlots(); // Refresh slots
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDateItem = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isLeaveDate = center?.leaveDates?.includes(dateStr);
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const isToday = new Date().toDateString() === date.toDateString();
    const dayName = date.toLocaleString('default', { weekday: 'narrow' });
    const dayNum = date.getDate();

    return (
      <TouchableOpacity
        key={date.toISOString()}
        disabled={isLeaveDate}
        onPress={() => setSelectedDate(date)}
        style={[
          styles.dateItem,
          isSelected && styles.dateItemSelected,
          isLeaveDate && styles.dateItemDisabled
        ]}
      >
        <Text style={[
          styles.dayName,
          isSelected && styles.textWhite,
          isLeaveDate && styles.textDisabled
        ]}>{dayName}</Text>
        <Text style={[
          styles.dayNum,
          isSelected && styles.textWhite,
          isLeaveDate && styles.textDisabled
        ]}>{dayNum}</Text>
        {isLeaveDate ? (
          <Text style={styles.closedLabel}>CLOSED</Text>
        ) : (
          isToday && !isSelected && <Text style={styles.todayText}>TODAY</Text>
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
          styles.slotItem,
          isSelected && styles.slotItemSelected
        ]}
      >
        <Text style={[styles.slotTime, isSelected && styles.textWhite]}>
          {timeStr}
        </Text>
        <Text style={[
          styles.slotStatus,
          isSelected ? styles.textWhite : styles.textSuccess
        ]}>
          {isSelected ? 'Selected' : 'Available'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  const price = pkg?.price || pkg?.basePrice || 0;
  const isReady = selectedDate && selectedTime && selectedVehicle;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Select Schedule</Text>
          <Text style={styles.headerSubtitle}>{center?.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Select Vehicle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SELECT VEHICLE</Text>
            <TouchableOpacity onPress={() => setIsAddVehicleVisible(true)}>
              <Text style={styles.addNewText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleList}>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setSelectedVehicle(v.id)}
                style={styles.vehicleItem}
              >
                <View style={[styles.vehicleImageWrapper, selectedVehicle === v.id && styles.vehicleSelected]}>
                  {v.imageUrl ? (
                    <Image source={{ uri: v.imageUrl }} style={styles.vehicleImage} />
                  ) : (
                    <Ionicons
                      name={getVehicleIcon(v.vehicleType)}
                      size={40}
                      color={selectedVehicle === v.id ? "#F97316" : "#9CA3AF"}
                    />
                  )}
                  {selectedVehicle === v.id && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={[styles.vehicleName, selectedVehicle === v.id && styles.textOrange]}>{v.brand} {v.model}</Text>
              </TouchableOpacity>
          </ScrollView>

          {selectedVehicleObj && !compatibility.isCompatible && (
            <View style={styles.incompatibleWarningBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.incompatibleWarningText}>
                {compatibility.reason}
              </Text>
            </View>
          )}
        </View>

        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity><Ionicons name="chevron-back" size={20} color="#F97316" /></TouchableOpacity>
            <Text style={styles.monthYear}>{currentMonthYear}</Text>
            <TouchableOpacity><Ionicons name="chevron-forward" size={20} color="#F97316" /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
            {dates.map(renderDateItem)}
          </ScrollView>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          {!selectedDate ? (
            <View style={{ padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={{ marginLeft: 10, color: '#6B7280', fontSize: 13, fontWeight: '600' }}>Please select a date to view available time slots.</Text>
            </View>
          ) : isLoadingSlots ? (
            <View style={{ padding: 16, backgroundColor: '#FFF7ED', borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#F97316" />
              <Text style={{ marginLeft: 10, color: '#F97316', fontSize: 13, fontWeight: '700' }}>Checking live slot availability...</Text>
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
              <Text style={{ marginLeft: 10, color: '#EF4444', fontSize: 13, fontWeight: '700', flex: 1 }}>No available slots for this package on the selected date. Please choose another date.</Text>
            </View>
          ) : (
            <>
              {morningSlots.length > 0 && (
                <View style={styles.timeCategory}>
                  <View style={styles.categoryTitleRow}>
                    <Ionicons name="sunny-outline" size={22} color="#F97316" />
                    <Text style={styles.categoryName}>Morning</Text>
                    <Text style={styles.timeRange}>08:00 - 11:59</Text>
                  </View>
                  <View style={styles.slotsGrid}>
                    {morningSlots.map(renderDynamicSlot)}
                  </View>
                </View>
              )}

              {afternoonSlots.length > 0 && (
                <View style={styles.timeCategory}>
                  <View style={styles.categoryTitleRow}>
                    <Ionicons name="sunny" size={22} color="#F97316" />
                    <Text style={styles.categoryName}>Afternoon</Text>
                    <Text style={styles.timeRange}>12:00 - 16:59</Text>
                  </View>
                  <View style={styles.slotsGrid}>
                    {afternoonSlots.map(renderDynamicSlot)}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.estimatedLabel}>ESTIMATED TOTAL</Text>
          <Text style={styles.estimatedPrice}>LKR {price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedBtn, (isProcessing || !isReady) && styles.proceedBtnDisabled]}
          onPress={handleProceed}
          disabled={isProcessing || !isReady}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.proceedText}>Book Now</Text>
          )}
        </TouchableOpacity>
      </View>

      <AddVehicleModal
        visible={isAddVehicleVisible}
        onClose={() => setIsAddVehicleVisible(false)}
        onSuccess={() => {
          setIsAddVehicleVisible(false);
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    marginTop: 1,
  },
  scrollContent: { paddingBottom: 120 },
  section: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
  addNewText: { fontSize: 14, color: '#F97316', fontWeight: '700' },
  vehicleList: { paddingHorizontal: 20, gap: 20 },
  vehicleItem: { alignItems: 'center', width: 100 },
  vehicleImageWrapper: { width: 90, height: 90, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  vehicleSelected: { borderColor: '#F97316', backgroundColor: '#fff' },
  vehicleImage: { width: 70, height: 70, borderRadius: 12 },
  checkBadge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  vehicleName: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#9CA3AF', textAlign: 'center' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30, marginBottom: 20 },
  monthYear: { fontSize: 18, fontWeight: '700', color: '#111827' },
  dateList: { paddingHorizontal: 20, gap: 15 },
  dateItem: { width: 60, height: 85, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  dateItemSelected: { backgroundColor: '#F97316', elevation: 8, shadowColor: '#F97316', shadowOpacity: 0.3 },
  dayName: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  dayNum: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 2 },
  todayText: { fontSize: 8, fontWeight: '800', color: '#F97316', marginTop: 4 },
  textWhite: { color: '#fff' },
  textOrange: { color: '#F97316' },
  timeCategory: { paddingHorizontal: 20, marginTop: 24 },
  categoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  categoryName: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  timeRange: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  slotItem: { width: (width - 55) / 2, padding: 16, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6' },
  slotItemSelected: { backgroundColor: '#F97316', borderColor: '#F97316' },
  slotItemBusy: { backgroundColor: '#F9FAFB' },
  slotTime: { fontSize: 16, fontWeight: '700', color: '#111827' },
  slotStatus: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  textSuccess: { color: '#10B981' },
  textError: { color: '#EF4444' },
  textDisabled: { color: '#D1D5DB' },
  dateItemDisabled: { backgroundColor: '#F3F4F6', opacity: 0.6 },
  closedLabel: { fontSize: 8, fontWeight: '800', color: '#EF4444', marginTop: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  estimatedLabel: { fontSize: 11, fontWeight: '800', color: '#9CA3AF' },
  estimatedPrice: { fontSize: 20, fontWeight: '800', color: '#F97316', marginTop: 2 },
  proceedBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  proceedBtnDisabled: { backgroundColor: '#E5E7EB', opacity: 0.7 },
  proceedText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  incompatibleWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  incompatibleWarningText: {
    flex: 1,
    fontSize: 12.5,
    color: '#991B1B',
    fontWeight: '700',
    lineHeight: 18,
  },
});
