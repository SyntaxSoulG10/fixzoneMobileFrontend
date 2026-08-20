import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingService, BookingResponseDTO } from '../../services/bookingService';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { serviceCenterService, ServiceCenterDTO } from '../../services/serviceCenterService';

const { width } = Dimensions.get('window');

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingResponseDTO | null>(null);
  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const bookingData = await bookingService.getBookingById(id as string);
        setBooking(bookingData);

        const [vehicleData, centerData] = await Promise.all([
          vehicleService.getVehicleById(bookingData.vehicleId),
          serviceCenterService.getServiceCenterById(bookingData.centerId)
        ]);

        setVehicle(vehicleData);
        setCenter(centerData);
      } catch (e) {
        console.error('Failed to load invoice data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#E84E0F" />
      </View>
    );
  }

  if (!booking || !center || !vehicle) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={{ marginTop: 16, fontSize: 18, color: '#6B7280', fontWeight: '600' }}>Invoice not available</Text>
        </View>
      </View>
    );
  }

  const isCompleted = booking.status === 'COMPLETED';
  const pkg = center.servicePackages?.find(p => p.packageId === booking.packageId || p.id === booking.packageId);

  const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>{isCompleted ? 'Payment Successful' : 'Booking Confirmed'}</Text>
          <Text style={styles.statusDate}>{formattedDate} | {booking.bookingTime}</Text>
        </View>

        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          <Text style={styles.cardSectionTitle}>Service Summary</Text>

          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Service Center</Text>
              <Text style={styles.detailValue}>{center.name}</Text>
              <Text style={styles.detailSubValue}>{center.address}</Text>
            </View>
            <Ionicons name="business" size={24} color="#E84E0F" />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Vehicle Details</Text>
              <Text style={styles.detailValue}>{vehicle.brand} {vehicle.model}</Text>
              <Text style={styles.detailSubValue}>{vehicle.plateNumber}</Text>
            </View>
            <Ionicons name="car" size={24} color="#E84E0F" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Service Items {isCompleted ? 'Completed' : 'Included'}</Text>
          {pkg?.features && pkg.features.length > 0 ? (
            pkg.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Standard service items included</Text>
          )}

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Payment Breakdown</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Package Cost</Text>
            <Text style={styles.priceValue}>LKR {(booking.estimatedCost || 0).toLocaleString()}.00</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Booking Fee (Paid)</Text>
            <Text style={styles.priceValue}>LKR {(booking.bookingFee || 0).toLocaleString()}.00</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isCompleted ? 'Total Paid' : 'Balance to be Paid'}
            </Text>
            <Text style={styles.totalValue}>LKR {((booking.estimatedCost || 0) - (isCompleted ? 0 : (booking.bookingFee || 0))).toLocaleString()}.00</Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <View>
              <Text style={styles.paymentInfoLabel}>Status</Text>
              <Text style={styles.paymentInfoValue}>{booking.status === 'CONFIRMED' ? 'Ready for Service' : booking.status.replace('_', ' ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paymentInfoLabel}>Booking ID</Text>
              <Text style={styles.paymentInfoValue}>{booking.bookingId.substr(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isCompleted && (
          <TouchableOpacity style={styles.downloadButton}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.downloadButtonText}>Download Invoice (PDF)</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.wishSection}>
            <Text style={styles.wishText}>Thank you, come again!</Text>
          </View>
        )}


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  invoiceCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '800',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '800',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#E84E0F',
  },
  wishSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  wishText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E84E0F',
    fontStyle: 'italic',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentInfoLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  paymentInfoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 10,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
});
