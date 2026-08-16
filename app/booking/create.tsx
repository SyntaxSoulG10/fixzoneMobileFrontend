import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';
import { bookingService } from '../../services/bookingService';
import { getVehicleIcon } from '../../utils/vehicle_utils';
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
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      arr.push(date);
    }
    return arr;
  }, []);

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

  const fetchSlots = useCallback(async () => {
    if (!centerId || !selectedDate) return;
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const slots = await bookingService.getAvailableSlots(centerId, dateStr);
      setAvailableSlots(slots);
      
      // Clear selection if it's no longer available
      if (selectedTime && !slots.includes(selectedTime.split(' ')[0])) {
        setSelectedTime(null);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    }
  }, [centerId, selectedDate, selectedTime]);

  useEffect(() => {
    fetchSlots();
  }, [selectedDate, centerId]);

  const generateSlotData = (time: string): TimeSlot => {
    // Convert "01:00 PM" to "13:00" for backend comparison
    const [timePart, ampm] = time.split(' ');
    let [hours, minutes] = timePart.split(':');
    let hoursNum = parseInt(hours);
    
    if (ampm === 'PM' && hoursNum !== 12) hoursNum += 12;
    if (ampm === 'AM' && hoursNum === 12) hoursNum = 0;
    
    const backendFormat = `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
    
    // Backend returns "08:00-09:00", so we check if any slot starts with our time
    const isAvailable = availableSlots.some(slot => slot.startsWith(backendFormat));
    
    return {
      id: time,
      time: time,
      status: selectedTime === time ? 'Selected' : (isAvailable ? 'Available' : 'Busy')
    };
  };

  const morningSlots: TimeSlot[] = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM'
  ].map(generateSlotData);

  const afternoonSlots: TimeSlot[] = [
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'
  ].map(generateSlotData);

  const handleProceed = async () => {
    if (!selectedVehicle) {
      Alert.alert('Selection Required', 'Please select a vehicle first.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Selection Required', 'Please select a time slot.');
      return;
    }

    try {
      setIsProcessing(true);
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const timeStr = selectedTime.split(' ')[0]; // "09:00 AM" -> "09:00"

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

  const renderTimeSlot = (slot: TimeSlot) => {
    const isSelected = selectedTime === slot.time;
    const isBusy = slot.status === 'Busy';

    return (
      <TouchableOpacity
        key={slot.id}
        disabled={isBusy}
        onPress={() => setSelectedTime(slot.time)}
        style={[
          styles.slotItem,
          isSelected && styles.slotItemSelected,
          isBusy && styles.slotItemBusy
        ]}
      >
        <Text style={[styles.slotTime, isSelected && styles.textWhite, isBusy && styles.textDisabled]}>
          {slot.time}
        </Text>
        <Text style={[
          styles.slotStatus, 
          isSelected ? styles.textWhite : (isBusy ? styles.textError : styles.textSuccess)
        ]}>
          {isSelected ? 'Selected' : slot.status}
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
        <View style={{ width: 44 }} />
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
            ))}
          </ScrollView>
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
          <View style={styles.timeCategory}>
            <View style={styles.categoryTitleRow}>
              <Ionicons name="sunny-outline" size={22} color="#F97316" />
              <Text style={styles.categoryName}>Morning</Text>
              <Text style={styles.timeRange}>08:00 - 11:59</Text>
            </View>
            <View style={styles.slotsGrid}>
              {morningSlots.map(renderTimeSlot)}
            </View>
          </View>

          <View style={styles.timeCategory}>
            <View style={styles.categoryTitleRow}>
              <Ionicons name="sunny" size={22} color="#F97316" />
              <Text style={styles.categoryName}>Afternoon</Text>
              <Text style={styles.timeRange}>12:00 - 16:59</Text>
            </View>
            <View style={styles.slotsGrid}>
              {afternoonSlots.map(renderTimeSlot)}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  headerIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  scrollContent: { paddingBottom: 120 },
  section: { marginTop: 24 },
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
  dateItem: { width: 60, height: 85, borderRadius: 20, backgroundColor: '#fff', borderVertical: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
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
});
