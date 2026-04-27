import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_BOOKINGS, MOCK_SERVICE_CENTERS, MOCK_VEHICLES } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const booking = MOCK_BOOKINGS.find(b => b.id === id);
  const center = MOCK_SERVICE_CENTERS.find(c => c.id === booking?.centerId);
  const vehicle = MOCK_VEHICLES.find(v => v.id === booking?.vehicleId);
  const pkg = center?.packages.find(p => p.id === booking?.packageId);

  if (!booking || !center || !vehicle || !pkg) {
    return (
      <View style={styles.container}>
        <Text>Invoice not available</Text>
      </View>
    );
  }

  const isCompleted = booking.status === 'Completed';

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
          <Text style={styles.statusDate}>{booking.month} {booking.date}, {booking.year} | {booking.time}</Text>
        </View>

        {/* Invoice Card */}
        <View style={styles.invoiceCard}>
          <Text style={styles.cardSectionTitle}>Service Summary</Text>

          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Service Center</Text>
              <Text style={styles.detailValue}>{center.name}</Text>
              <Text style={styles.detailSubValue}>{center.location}</Text>
            </View>
            <Ionicons name="business" size={24} color="#E84E0F" />
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View>
              <Text style={styles.detailLabel}>Vehicle Details</Text>
              <Text style={styles.detailValue}>{vehicle.name}</Text>
              <Text style={styles.detailSubValue}>{vehicle.plate}</Text>
            </View>
            <Ionicons name="car" size={24} color="#E84E0F" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Service Items Completed</Text>
          {pkg.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <Text style={styles.cardSectionTitle}>Payment Breakdown</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Package Cost</Text>
            <Text style={styles.priceValue}>LKR {booking.totalPrice.toLocaleString()}.00</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Booking Fee (Paid)</Text>
            <Text style={styles.priceValue}>LKR {booking.bookingFee.toLocaleString()}.00</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {isCompleted ? 'Balance Paid' : 'Balance to be Paid'}
            </Text>
            <Text style={styles.totalValue}>LKR {(booking.totalPrice - booking.bookingFee).toLocaleString()}.00</Text>
          </View>

          <View style={styles.paymentInfoRow}>
            <View>
              <Text style={styles.paymentInfoLabel}>Payment Method</Text>
              <Text style={styles.paymentInfoValue}>{booking.paymentMethod || 'N/A'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.paymentInfoLabel}>Invoice ID</Text>
              <Text style={styles.paymentInfoValue}>{booking.invoiceId || `INV-${booking.id.toUpperCase()}`}</Text>
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
  backButton: {
    padding: 4,
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
  statusIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  completedIconBg: {
    backgroundColor: '#D1FAE5',
  },
  pendingIconBg: {
    backgroundColor: '#FEE2E2',
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
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginHorizontal: 40,
    marginTop: 24,
    lineHeight: 18,
  },
});
