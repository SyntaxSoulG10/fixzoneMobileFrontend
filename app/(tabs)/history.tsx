import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MOCK_BOOKINGS, MOCK_VEHICLES, MOCK_SERVICE_CENTERS, Booking } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

type FilterStatus = 'All' | 'Completed' | 'Pending';

export default function HistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');

  const filteredBookings = MOCK_BOOKINGS.filter(booking => {
    if (activeFilter === 'All') return true;
    return booking.status === activeFilter;
  });

  // Group by Month (simplified for mock)
  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const key = `${booking.month.toUpperCase()} ${booking.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const renderBookingCard = (booking: Booking) => {
    const center = MOCK_SERVICE_CENTERS.find(c => c.id === booking.centerId);
    const vehicle = MOCK_VEHICLES.find(v => v.id === booking.vehicleId);
    const pkg = center?.packages.find(p => p.id === booking.packageId);

    const isPending = booking.status === 'Pending';

    return (
      <TouchableOpacity 
        key={booking.id} 
        style={styles.card}
        onPress={() => router.push(`/invoice/${booking.id}`)}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.cardTextContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, isPending ? styles.pendingBadge : styles.completedBadge]}>
                <Text style={[styles.statusText, isPending ? styles.pendingText : styles.completedText]}>
                  {booking.status}
                </Text>
              </View>
              <Text style={styles.dateText}>{booking.month} {booking.date}</Text>
            </View>
            
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {pkg?.name.split(' (')[0] || 'Full Service'} - {vehicle?.name}
            </Text>
            <Text style={styles.bookingDetails}>
              {vehicle?.plate}  = LKR {booking.totalPrice.toLocaleString()}
            </Text>

            <View style={styles.actionRow}>
              {isPending ? (
                <>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { marginLeft: 12 }]}>
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.actionButton, styles.rebookButton]}>
                    <Text style={styles.actionButtonText}>Rebook</Text>
                  </TouchableOpacity>
                  <View 
                    style={styles.invoiceIconBtn}
                  >
                    <Ionicons name="document-text" size={24} color="#9CA3AF" />
                  </View>
                </>
              )}
            </View>
          </View>

          <Image 
            source={center?.image} 
            style={styles.centerImage} 
          />
        </View>
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
        <Text style={styles.headerTitle}>Service History</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {(['All', 'Completed', 'Pending'] as FilterStatus[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.activeFilterTab
            ]}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === filter && styles.activeFilterTabText
            ]}>
              {filter === 'All' ? 'All Services' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedBookings).map(monthYear => (
          <View key={monthYear} style={styles.monthSection}>
            <View style={styles.monthHeaderRow}>
              <Text style={styles.monthTitle}>{monthYear}</Text>
              <View style={styles.monthDivider} />
            </View>
            {groupedBookings[monthYear].map(renderBookingCard)}
          </View>
        ))}
        {filteredBookings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#E5E7EB" />
            <Text style={styles.emptyText}>No {activeFilter.toLowerCase()} services found</Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E84E0F',
    minWidth: 100,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#E84E0F',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E84E0F',
  },
  activeFilterTabText: {
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  monthSection: {
    marginTop: 20,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  monthDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#111827',
    marginLeft: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTextContent: {
    flex: 1,
    marginRight: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  pendingBadge: {
    backgroundColor: '#FEE2E2',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pendingText: {
    color: '#EF4444',
  },
  completedText: {
    color: '#10B981',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  bookingDetails: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 12,
  },
  centerImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rebookButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  invoiceIconBtn: {
    marginLeft: 15,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
