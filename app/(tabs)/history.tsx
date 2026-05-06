import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBookings } from '../../context/BookingContext';
import { BookingResponseDTO } from '../../services/bookingService';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');

type FilterStatus = 'All' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';

export default function HistoryScreen() {
  const router = useRouter();
  const { bookings, cancelBooking, isLoading } = useBookings();
  const { user: authUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [userVehicles, setUserVehicles] = useState<VehicleResponse[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponseDTO | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  React.useEffect(() => {
    const fetchVehicles = async () => {
      if (!authUser?.userId) return;
      try {
        const data = await vehicleService.getVehiclesByUser(authUser.userId);
        setUserVehicles(data);
      } catch (e) {
        console.error('Failed to fetch vehicles in history', e);
      }
    };
    fetchVehicles();
  }, [authUser?.userId]);

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'All') return true;
    const status = booking.status.toUpperCase();
    if (activeFilter === 'Upcoming') {
      return status === 'CONFIRMED';
    }
    if (activeFilter === 'In Progress') {
      return status === 'IN_PROGRESS';
    }
    return status === activeFilter.toUpperCase();
  });

  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const date = new Date(booking.bookingDate);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, BookingResponseDTO[]>);

  const getDaysRemaining = (booking: BookingResponseDTO) => {
    const bookingDate = new Date(booking.bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = bookingDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleReschedule = (booking: BookingResponseDTO) => {
    const daysRemaining = getDaysRemaining(booking);
    if (daysRemaining >= 3) {
      router.push({
        pathname: '/booking/reschedule',
        params: { bookingId: booking.bookingId }
      });
    } else {
      Alert.alert(
        'Cannot Reschedule',
        'Rescheduling is only allowed at least 3 days before the scheduled date.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancel = (booking: BookingResponseDTO) => {
    const daysRemaining = getDaysRemaining(booking);
    const penalty = daysRemaining < 3 ? (booking.estimatedCost || 0) * 0.05 : 0;
    const penaltyMsg = penalty > 0 
      ? `\n\nNote: A 5% penalty (LKR ${penalty.toLocaleString()}) will be applied as the cancellation is within 3 days.`
      : '';

    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel this booking?${penaltyMsg}`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(booking.bookingId);
              const msg = penalty > 0 
                ? `Booking cancelled. A penalty of LKR ${penalty.toLocaleString()} has been applied.`
                : 'Booking cancelled successfully.';
              Alert.alert('Cancelled', msg);
              setIsSummaryVisible(false);
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const openSummary = (booking: BookingResponseDTO) => {
    setSelectedBooking(booking);
    setIsSummaryVisible(true);
  };

  const renderBookingCard = (booking: BookingResponseDTO) => {
    const vehicle = userVehicles.find(v => v.id === booking.vehicleId);
    
    const isInProgress = booking.status === 'IN_PROGRESS';
    const isPending = booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT';
    const isUpcomingOrActive = isPending || isInProgress;
    const isCancelled = booking.status === 'CANCELLED';

    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity 
        key={booking.bookingId} 
        style={styles.card}
        onPress={() => openSummary(booking)}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.cardTextContent}>
            <View style={styles.statusRow}>
              <View style={[
                styles.statusBadge, 
                isInProgress ? styles.inProgressBadge : 
                (isPending ? styles.pendingBadge : 
                (isCancelled ? styles.cancelledBadge : styles.completedBadge))
              ]}>
                <Text style={[
                  styles.statusText, 
                  isInProgress ? styles.inProgressText : 
                  (isPending ? styles.pendingText : 
                  (isCancelled ? styles.cancelledText : styles.completedText))
                ]}>
                  {booking.status.replace('_', ' ')}
                </Text>
              </View>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {booking.packageName || 'Service'} - {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
            </Text>
            <Text style={styles.bookingDetails}>
              {vehicle?.plateNumber}  = LKR {(booking.estimatedCost || 0).toLocaleString()}
            </Text>

            <View style={styles.actionRow}>
              {isPending ? (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleReschedule(booking)}>
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { marginLeft: 12, backgroundColor: '#6B7280' }]} onPress={() => handleCancel(booking)}>
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : !isCancelled ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rebookButton]}
                    onPress={() => router.push({
                      pathname: '/booking/create',
                      params: { 
                        centerId: booking.centerId, 
                        packageId: booking.packageId,
                        packageName: booking.packageName
                      }
                    })}
                  >
                    <Text style={styles.actionButtonText}>Rebook</Text>
                  </TouchableOpacity>
                  <View style={styles.invoiceIconBtn}>
                    <Ionicons name="document-text" size={24} color="#9CA3AF" />
                  </View>
                </>
              ) : null}
            </View>
          </View>

          <View style={[styles.centerImagePlaceholder, { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="business" size={40} color="#D1D5DB" />
          </View>
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
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScrollContent}
        >
          {(['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'] as FilterStatus[]).map((filter) => (
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
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {Object.keys(groupedBookings).sort((a,b) => b.localeCompare(a)).map(monthYear => (
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

      {/* Summary Modal */}
      <Modal
        visible={isSummaryVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSummaryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Booking Summary</Text>
              <TouchableOpacity onPress={() => setIsSummaryVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalContent}>
                  {/* Center Info */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Service Center</Text>
                    <Text style={styles.sectionValue}>{selectedBooking.serviceCenterName}</Text>
                  </View>

                  {/* Vehicle Info */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Vehicle</Text>
                    <Text style={styles.sectionValue}>
                      {userVehicles.find(v => v.id === selectedBooking.vehicleId)?.brand} {userVehicles.find(v => v.id === selectedBooking.vehicleId)?.model}
                    </Text>
                    <Text style={styles.sectionSubValue}>
                      {userVehicles.find(v => v.id === selectedBooking.vehicleId)?.plateNumber}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={[styles.summarySection, { flex: 1 }]}>
                      <Text style={styles.sectionLabel}>Date</Text>
                      <Text style={styles.sectionValue}>{new Date(selectedBooking.bookingDate).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.summarySection, { flex: 1 }]}>
                      <Text style={styles.sectionLabel}>Time</Text>
                      <Text style={styles.sectionValue}>{selectedBooking.bookingTime}</Text>
                    </View>
                  </View>

                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Package</Text>
                    <Text style={styles.sectionValue}>{selectedBooking.packageName}</Text>
                  </View>

                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Estimated Cost</Text>
                    <Text style={[styles.sectionValue, { color: '#E84E0F' }]}>LKR {(selectedBooking.estimatedCost || 0).toLocaleString()}</Text>
                  </View>

                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Status</Text>
                    <View style={styles.modalStatusBadge}>
                      <Text style={styles.modalStatusText}>{selectedBooking.status.replace('_', ' ')}</Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    {selectedBooking.status === 'PENDING' && (
                      <View style={styles.modalSecondaryActions}>
                        <TouchableOpacity 
                          style={[styles.secondaryBtn, { borderColor: '#E84E0F' }]}
                          onPress={() => {
                            setIsSummaryVisible(false);
                            handleReschedule(selectedBooking);
                          }}
                        >
                          <Text style={[styles.secondaryBtnText, { color: '#E84E0F' }]}>Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.secondaryBtn, { borderColor: '#EF4444' }]}
                          onPress={() => handleCancel(selectedBooking)}
                        >
                          <Text style={[styles.secondaryBtnText, { color: '#EF4444' }]}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  filterScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E84E0F',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  inProgressBadge: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pendingText: {
    color: '#EF4444',
  },
  inProgressText: {
    color: '#2563EB',
  },
  completedText: {
    color: '#10B981',
  },
  cancelledBadge: {
    backgroundColor: '#E5E7EB',
  },
  cancelledText: {
    color: '#6B7280',
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
  centerImagePlaceholder: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  summaryModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalContent: {
    paddingBottom: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubValue: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalStatusBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
  },
  modalActions: {
    marginTop: 10,
  },
  fullInvoiceBtn: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  fullInvoiceBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  modalSecondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
