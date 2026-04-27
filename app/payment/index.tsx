import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_VEHICLES, MOCK_SERVICE_CENTERS } from '../../constants/mock_data';
import { useBookings } from '../../context/BookingContext';

const { width } = Dimensions.get('window');

export default function InitialPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addBooking } = useBookings();

  // Extract data from params
  const { id, packageId, date, time, vehicleId, centerName, packageName, price: priceParam } = params;

  // Find objects
  // Find objects or use fallbacks
  const center = MOCK_SERVICE_CENTERS.find(c => c.id === id) || { 
    name: centerName as string || 'Service Center', 
    location: 'Selected Center' 
  };
  
  const mockPkg = (center as any).packages?.find((p: any) => p.id === packageId);
  const pkg = mockPkg || { 
    name: packageName as string || 'Service Package', 
    price: parseFloat(priceParam as string) || 0 
  };
  
  const vehicle = MOCK_VEHICLES.find(v => v.id === vehicleId) || { 
    name: 'Your Vehicle', 
    plate: '', 
    image: require('../../assets/images/honda_vezel_silver.jpg') 
  };

  // States
  const [isProcessing, setIsProcessing] = useState(false);

  if (!center.name || !pkg.name || !vehicle.name) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 100 }}>Missing booking information</Text>
      </View>
    );
  }

  const totalPrice = pkg.price;
  const bookingCharge = totalPrice * 0.1;
  const discount = 0;

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Add to booking history
      addBooking({
        id: Math.random().toString(36).substr(2, 9),
        status: 'Pending',
        centerId: center.id,
        packageId: pkg.id,
        vehicleId: vehicle.id,
        date: date as string,
        time: time as string,
        month: 'Oct', // Simplified for prototype
        year: '2026',
        totalPrice: totalPrice,
        bookingFee: bookingCharge,
        paymentMethod: 'Card Payment',
        invoiceId: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      });

      router.replace({
        pathname: '/booking/success',
        params: {
          centerName: center.name,
          vehicleName: vehicle.name,
          date: date as string,
          time: time as string,
          price: pkg.price.toLocaleString()
        }
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Initial Payment</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Vehicle & Schedule Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.vehicleInfoSection}>
            <Image source={vehicle.image || require('../../assets/images/honda_vezel_silver.jpg')} style={styles.vehicleHeroImage} />
            <View style={styles.vehicleOverlay}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
            </View>
          </View>
          
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIconBg}>
                <Ionicons name="calendar" size={20} color="#E84E0F" />
              </View>
              <View>
                <Text style={styles.scheduleLabel}>Schedule Date</Text>
                <Text style={styles.scheduleValue}>{date}</Text>
              </View>
            </View>
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleIconBg}>
                <Ionicons name="time" size={20} color="#E84E0F" />
              </View>
              <View>
                <Text style={styles.scheduleLabel}>Arrival Time</Text>
                <Text style={styles.scheduleValue}>{time}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Booking Price</Text>
            <Text style={styles.breakdownValue}>Rs {totalPrice.toLocaleString()}.00</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Discount</Text>
            <Text style={styles.breakdownValue}>Rs {discount.toLocaleString()}.00</Text>
          </View>
          
          <View style={styles.chargeBanner}>
            <View>
              <Text style={styles.chargeLabel}>Booking Charge (10%)</Text>
              <Text style={styles.chargeSubtext}>Pay now to confirm slot</Text>
            </View>
            <Text style={styles.chargeValue}>Rs {bookingCharge.toLocaleString()}.00</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 16 }]}>
            <Text style={[styles.breakdownLabel, { color: '#6B7280' }]}>Balance to Pay</Text>
            <Text style={[styles.breakdownValue, { color: '#6B7280' }]}>
              Rs {(totalPrice * 0.9).toLocaleString()}.00 + extra
            </Text>
          </View>

          <View style={styles.noteContainer}>
            <Ionicons name="information-circle" size={20} color="#EF4444" />
            <Text style={styles.noteText}>
              Note: Remaining balance will be collected at Service Center after service completion
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Pay Booking Charge</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
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
    paddingBottom: 120,
  },
  summaryCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  vehicleInfoSection: {
    height: 180,
    position: 'relative',
  },
  vehicleHeroImage: {
    width: '100%',
    height: '100%',
  },
  vehicleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  vehicleName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  vehiclePlate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  scheduleRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  scheduleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scheduleLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  chargeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  chargeLabel: {
    fontSize: 16,
    color: '#E84E0F',
    fontWeight: '800',
  },
  chargeSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  chargeValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E84E0F',
  },
  noteContainer: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E84E0F',
    paddingVertical: 16,
    borderRadius: 25,
  },
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
  },
});
