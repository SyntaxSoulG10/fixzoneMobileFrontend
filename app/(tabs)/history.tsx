import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBookings } from '../../context/BookingContext';
import { bookingService, BookingResponseDTO, BookingStatusHistoryDTO } from '../../services/bookingService';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';
import { Modal, ActivityIndicator } from 'react-native';
import { MOCK_SERVICE_CENTERS } from '../../constants/mock_data';
import { checkNotificationsNow } from '../../components/NotificationPoller';
import { downloadInvoicePDF } from '../../services/pdfService';
import { formatTimeFromBackend, formatDisplayDate, formatDisplayDateTime } from '../../utils/date_utils';

import { clearCache } from '../../services/api';

const { width } = Dimensions.get('window');

function formatDuration(mins?: number): string {
  if (!mins || mins <= 0) return '60 mins';
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (remMins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${remMins} mins`;
}

type FilterStatus = 'All' | 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';

export default function HistoryScreen() {
  const router = useRouter();
  const { bookings, cancelBooking, isLoading, refreshBookings, updateSingleBooking } = useBookings();
  const { user: authUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [userVehicles, setUserVehicles] = useState<VehicleResponse[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponseDTO | null>(null);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistoryDTO[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshBookings();
    }, [refreshBookings])
  );

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    await clearCache();
    await refreshBookings();
    setIsRefreshing(false);
  };

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

  // Keep open summary modal updated in real-time (status & history timeline polling)
  React.useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isSummaryVisible && selectedBooking) {
      const targetId = selectedBooking.bookingId;

      const fetchRealtimeData = async () => {
        try {
          const [history, latestBooking] = await Promise.all([
            bookingService.getStatusHistory(targetId),
            bookingService.getBookingById(targetId)
          ]);

          setStatusHistory(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(history)) {
              return history;
            }
            return prev;
          });

          if (latestBooking) {
            updateSingleBooking(latestBooking);
            setSelectedBooking(prev => {
              if (prev && (prev.status !== latestBooking.status || prev.bookingDate !== latestBooking.bookingDate || prev.bookingTime !== latestBooking.bookingTime)) {
                return latestBooking;
              }
              return prev;
            });
          }
        } catch (e) {
          console.error('Error fetching realtime summary data', e);
        }
      };

      // Poll every 2.5 seconds silently for realtime timeline and status updates
      intervalId = setInterval(fetchRealtimeData, 2500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSummaryVisible, selectedBooking?.bookingId, updateSingleBooking]);

  const getFilterCount = (filter: FilterStatus) => {
    if (filter === 'All') return bookings.length;
    if (filter === 'Upcoming') {
      return bookings.filter(b => {
        const s = b.status.toUpperCase();
        return s === 'CONFIRMED' || s === 'PENDING' || s === 'PENDING_PAYMENT';
      }).length;
    }
    if (filter === 'Cancelled') {
      return bookings.filter(b => {
        const s = b.status.toUpperCase();
        return s === 'CANCELLED' || s === 'EXPIRED';
      }).length;
    }
    return bookings.filter(b => b.status.toUpperCase() === filter.toUpperCase()).length;
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeFilter === 'All') return true;
    const status = booking.status.toUpperCase();
    if (activeFilter === 'Upcoming') {
      return status === 'CONFIRMED' || status === 'PENDING' || status === 'PENDING_PAYMENT';
    }
    if (activeFilter === 'In Progress') {
      return status === 'IN_PROGRESS';
    }
    if (activeFilter === 'Cancelled') {
      return status === 'CANCELLED' || status === 'EXPIRED';
    }
    return status === activeFilter.toUpperCase();
  }).sort((a, b) => {
    const dateA = new Date(`${a.bookingDate}T${a.bookingTime || '00:00:00'}`);
    const dateB = new Date(`${b.bookingDate}T${b.bookingTime || '00:00:00'}`);
    if (activeFilter === 'Upcoming') {
      return dateA.getTime() - dateB.getTime();
    }
    return dateB.getTime() - dateA.getTime();
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
    if (!booking.bookingDate) return 0;

    // Parse "YYYY-MM-DD" manually to ensure we create a Date in LOCAL time
    const [year, month, day] = booking.bookingDate.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = bookingDate.getTime() - today.getTime();
    // Use floor to get the number of full days between now and the booking
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
    const baseFee = booking.bookingFee ?? booking.estimatedCost ?? 0;
    const penalty = daysRemaining < 3 ? baseFee * 0.05 : 0;
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
              setIsSummaryVisible(false);
              const msg = penalty > 0
                ? `Booking cancelled. A penalty of LKR ${penalty.toLocaleString()} has been applied.`
                : 'Booking cancelled successfully.';
              Alert.alert('Cancelled', msg, [
                {
                  text: 'OK',
                  onPress: () => {
                    checkNotificationsNow();
                  }
                }
              ]);
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handlePayPendingBooking = (booking: BookingResponseDTO) => {
    setIsSummaryVisible(false);
    const vehicleObj = userVehicles.find(v => v.id === booking.vehicleId);

    const dateStr = typeof booking.bookingDate === 'string'
      ? booking.bookingDate.split('T')[0]
      : new Date(booking.bookingDate).toISOString().split('T')[0];

    const timeStr = formatTimeFromBackend(booking.bookingTime);

    router.push({
      pathname: '/payment',
      params: {
        bookingId: booking.bookingId,
        id: booking.centerId,
        packageId: booking.packageId,
        date: dateStr,
        time: timeStr,
        vehicleId: booking.vehicleId,
        centerName: booking.serviceCenterName,
        packageName: booking.packageName,
        price: (booking.estimatedCost || 0).toString(),
        vehicleName: vehicleObj ? `${vehicleObj.brand} ${vehicleObj.model}` : 'Your Vehicle',
        vehiclePlate: vehicleObj?.plateNumber || ''
      }
    });
  };
  const getPackageBullets = (booking: BookingResponseDTO) => {
    let desc = booking.packageDescription;

    if (!desc) {
      desc = MOCK_SERVICE_CENTERS.find(c => c.id === booking.centerId)?.packages?.find(p => p.id === booking.packageId)?.description;
    }

    if (!desc) {
      return [
        'Full System & Engine Inspection',
        'Professional Care & Oil Check',
        'Quality Guaranteed & Road Testing'
      ];
    }

    const items = desc
      .split(/[\n;•]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return items.length > 0 ? items : [desc];
  };

  const openSummary = async (booking: BookingResponseDTO) => {
    setSelectedBooking(booking);
    setIsSummaryVisible(true);
    setStatusHistory([]);
    setIsLoadingHistory(true);
    try {
      const history = await bookingService.getStatusHistory(booking.bookingId);
      setStatusHistory(history);
    } catch (e) {
      console.error('Failed to load status history', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const renderBookingCard = (booking: BookingResponseDTO) => {
    const vehicle = userVehicles.find(v => v.id === booking.vehicleId);

    const isInProgress = booking.status === 'IN_PROGRESS';
    const isPending = booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PENDING_PAYMENT';
    const isUpcomingOrActive = isPending || isInProgress;
    const isCancelledOrExpired = booking.status === 'CANCELLED' || booking.status === 'EXPIRED';

    const dateObj = new Date(booking.bookingDate);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    const isTodayBooking = (() => {
      if (!booking.bookingDate) return false;
      const parts = booking.bookingDate.split('-').map(Number);
      if (parts.length < 3) return false;
      const [y, m, d] = parts;
      const today = new Date();
      return today.getFullYear() === y && today.getMonth() === m - 1 && today.getDate() === d;
    })();

    return (
      <TouchableOpacity
        key={booking.bookingId}
        style={styles.card}
        onPress={() => openSummary(booking)}
        activeOpacity={0.9}
      >
        <View style={styles.cardMainRow}>
          {/* Left Column: Date Badge with vertical divider */}
          <View style={styles.dateCol}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>

          {/* Right Column: Details & Actions */}
          <View style={styles.cardRightCol}>
            {/* Package Name */}
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {booking.packageName || 'Service'}
            </Text>

            {/* Status Badge directly below Package Name */}
            <View style={[
              styles.statusBadge,
              isInProgress ? styles.inProgressBadge :
                (isPending ? styles.pendingBadge :
                  (isCancelledOrExpired ? styles.cancelledBadge : styles.completedBadge))
            ]}>
              <Text style={[
                styles.statusText,
                isInProgress ? styles.inProgressText :
                  (isPending ? styles.pendingText :
                    (isCancelledOrExpired ? styles.cancelledText : styles.completedText))
              ]}>
                {(booking.status === 'CONFIRMED' ? 'READY FOR SERVICE' : booking.status.replace(/_/g, ' ')).toUpperCase()}
              </Text>
            </View>

            {/* Vehicle Info */}
            <View style={styles.vehicleRow}>
              <Ionicons name="car-sport-outline" size={15} color="#64748B" />
              <Text style={styles.vehicleText} numberOfLines={1}>
                {vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.plateNumber}` : 'Your Vehicle'}
              </Text>
            </View>

            {/* Arrival Notice Banner */}
            {booking.status === 'CONFIRMED' && isTodayBooking && (
              <View style={styles.arrivalNoticeBanner}>
                <Ionicons name="information-circle-outline" size={14} color="#E84E0F" />
                <Text style={styles.arrivalNoticeText}>
                  Please arrive 10 mins before your appointment for your convenience.
                </Text>
              </View>
            )}

            {/* Actions Row */}
            {booking.status === 'PENDING_PAYMENT' && (
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.cardRescheduleBtn, { backgroundColor: '#E84E0F', borderColor: '#E84E0F' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePayPendingBooking(booking);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={15} color="#FFFFFF" />
                  <Text style={[styles.cardRescheduleText, { color: '#FFFFFF', fontWeight: '700' }]}>Pay</Text>
                </TouchableOpacity>
              </View>
            )}

            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardRescheduleBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleReschedule(booking);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={15} color="#334155" />
                  <Text style={styles.cardRescheduleText}>Reschedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardCancelBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancel(booking);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={15} color="#334155" />
                  <Text style={styles.cardCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Completed Service Divider & Download Invoice Link */}
            {booking.status === 'COMPLETED' && (
              <View style={styles.completedInvoiceContainer}>
                <View style={styles.cardDivider} />
                <TouchableOpacity
                  style={styles.invoiceLinkBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    downloadInvoicePDF(booking);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.invoiceLinkText}>Download Invoice</Text>
                  <Ionicons name="document-text" size={16} color="#E84E0F" />
                </TouchableOpacity>
              </View>
            )}
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
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {(['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'] as FilterStatus[]).map((filter) => {
            const isActive = activeFilter === filter;
            const count = getFilterCount(filter);
            const labelText = filter === 'All' ? 'All Services' : filter;

            return (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
                style={[
                  styles.filterTab,
                  isActive && styles.activeFilterTab
                ]}
              >
                <Text style={[
                  styles.filterTabText,
                  isActive && styles.activeFilterTabText
                ]}>
                  {labelText}
                </Text>
                <View style={[
                  styles.countBadge,
                  isActive && styles.activeCountBadge
                ]}>
                  <Text style={[
                    styles.countText,
                    isActive && styles.activeCountText
                  ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullToRefresh}
            colors={['#E84E0F']}
            tintColor="#E84E0F"
          />
        }
      >
        {Object.keys(groupedBookings).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          if (activeFilter === 'Upcoming') {
            return dateA.getTime() - dateB.getTime();
          }
          return dateB.getTime() - dateA.getTime();
        }).map(monthYear => (
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
                  {/* Current Status Badge */}
                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Current Status</Text>
                    <View style={styles.statusBadgeContainer}>
                      <Text style={styles.statusBadgeText}>{selectedBooking.status.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>

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
                      <Text style={styles.sectionValue}>{formatTimeFromBackend(selectedBooking.bookingTime)}</Text>
                    </View>
                    <View style={[styles.summarySection, { flex: 1 }]}>
                      <Text style={styles.sectionLabel}>Est. Duration</Text>
                      <Text style={styles.sectionValue}>
                        {formatDuration(selectedBooking.estimatedDurationMins || (selectedBooking as any).durationMins)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Package Details</Text>
                    <Text style={[styles.sectionValue, { marginBottom: 8 }]}>{selectedBooking.packageName}</Text>
                    <View style={styles.bulletListContainer}>
                      {getPackageBullets(selectedBooking).map((bullet, idx) => (
                        <View key={idx} style={styles.bulletItemRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Payment Breakdown (Conditional for Cancelled Bookings) */}
                  {selectedBooking.status === 'CANCELLED' ? (
                    <View style={[styles.summarySection, { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', marginTop: 8 }]}>
                      <Text style={[styles.sectionLabel, { marginBottom: 10, color: '#991B1B', fontWeight: '700', fontSize: 13 }]}>Cancellation Price Breakdown</Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Total Package Price</Text>
                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>
                          LKR {(selectedBooking.estimatedCost || 0).toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600' }}>Advance Paid</Text>
                        <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800' }}>
                          LKR {(selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)).toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600' }}>Penalty Applied</Text>
                        <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '800' }}>
                          - LKR {(selectedBooking.cancellationPenalty || 0).toLocaleString()}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FCA5A5' }}>
                        <Text style={{ fontSize: 13, color: '#059669', fontWeight: '700' }}>Refunded Amount</Text>
                        <Text style={{ fontSize: 14, color: '#059669', fontWeight: '900' }}>
                          LKR {Math.max(0, (selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)) - (selectedBooking.cancellationPenalty || 0)).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.summarySection, { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 }]}>
                      <Text style={[styles.sectionLabel, { marginBottom: 10, color: '#0F172A', fontWeight: '700', fontSize: 13 }]}>Payment Breakdown</Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Total Package Price (100%)</Text>
                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>
                          LKR {(selectedBooking.estimatedCost || 0).toLocaleString()}
                        </Text>
                      </View>

                      {selectedBooking.status === 'EXPIRED' ? (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600' }}>Required Advance Fee (40%)</Text>
                            <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '800' }}>
                              LKR {(selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)).toLocaleString()} (Unpaid)
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>Payment Status</Text>
                            <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '800' }}>Expired (0% Paid)</Text>
                          </View>
                        </>
                      ) : selectedBooking.status === 'PENDING_PAYMENT' ? (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: '#E84E0F', fontWeight: '600' }}>Required Advance Fee (40%)</Text>
                            <Text style={{ fontSize: 13, color: '#E84E0F', fontWeight: '800' }}>
                              LKR {(selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)).toLocaleString()} (Pending)
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>Balance Due at Center (60%)</Text>
                            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '800' }}>
                              LKR {(((selectedBooking.estimatedCost || 0) - (selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)))).toLocaleString()}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600' }}>Initial Advance Paid (40%)</Text>
                            <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800' }}>
                              LKR {(selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)).toLocaleString()}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                            <Text style={{ fontSize: 13, color: '#E84E0F', fontWeight: '600' }}>Balance Due at Center (60%)</Text>
                            <Text style={{ fontSize: 13, color: '#E84E0F', fontWeight: '800' }}>
                              LKR {(((selectedBooking.estimatedCost || 0) - (selectedBooking.bookingFee || ((selectedBooking.estimatedCost || 0) * 0.40)))).toLocaleString()}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  <View style={styles.summarySection}>
                    <Text style={styles.sectionLabel}>Status History & Timeline</Text>
                    {isLoadingHistory ? (
                      <ActivityIndicator size="small" color="#E84E0F" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
                    ) : (
                      <View style={styles.timelineContainer}>
                        {statusHistory.map((item, index) => {
                          const formattedTime = formatDisplayDateTime(item.changedAt);
                          const isLast = index === statusHistory.length - 1;

                          let iconName = "checkmark";
                          let iconColor = "#10B981";

                          if (item.statusDisplay?.includes('Rescheduled') || item.changedBy === 'CUSTOMER_RESCHEDULE') {
                            iconName = "calendar";
                            iconColor = "#8B5CF6";
                          } else if (item.status === 'PENDING_PAYMENT' || item.statusDisplay === 'Booking Created') {
                            iconName = "document-text";
                            iconColor = "#3B82F6";
                          } else if (item.status === 'CONFIRMED') {
                            iconName = "checkmark-circle";
                            iconColor = "#F97316";
                          } else if (item.status === 'IN_PROGRESS') {
                            iconName = "construct";
                            iconColor = "#2563EB";
                          } else if (item.status === 'COMPLETED') {
                            iconName = "checkmark-done-circle";
                            iconColor = "#10B981";
                          } else if (item.status === 'CANCELLED') {
                            iconName = "close-circle";
                            iconColor = "#EF4444";
                          }

                          return (
                            <View key={item.id || index} style={styles.timelineItem}>
                              <View style={styles.timelineLeftColumn}>
                                <View style={[styles.timelineDot, { backgroundColor: isLast ? iconColor : '#CBD5E1' }]}>
                                  <Ionicons name={iconName as any} size={10} color="#FFF" />
                                </View>
                                {!isLast && <View style={styles.timelineLine} />}
                              </View>

                              <View style={styles.timelineRightColumn}>
                                <Text style={[styles.timelineStatusTitle, isLast && { color: '#0F172A', fontWeight: '800' }]}>
                                  {item.statusDisplay}
                                </Text>
                                <Text style={styles.timelineTimeText}>{formattedTime}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    {selectedBooking.status === 'COMPLETED' && (
                      <TouchableOpacity
                        style={styles.fullInvoiceBtn}
                        onPress={() => {
                          setIsSummaryVisible(false);
                          downloadInvoicePDF(selectedBooking);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.fullInvoiceBtnText}>Download Invoice (PDF)</Text>
                      </TouchableOpacity>
                    )}

                    {selectedBooking.status === 'PENDING_PAYMENT' && (
                      <TouchableOpacity
                        style={[styles.fullInvoiceBtn, { backgroundColor: '#E84E0F', marginBottom: 0 }]}
                        onPress={() => handlePayPendingBooking(selectedBooking)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="card-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.fullInvoiceBtnText}>Pay</Text>
                      </TouchableOpacity>
                    )}

                    {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'PENDING') && (
                      <View style={styles.modalSecondaryActions}>
                        <TouchableOpacity
                          style={[styles.summaryCancelBtn, { borderColor: '#E84E0F' }]}
                          onPress={() => {
                            setIsSummaryVisible(false);
                            handleReschedule(selectedBooking);
                          }}
                        >
                          <Text style={[styles.summaryCancelBtnText, { color: '#E84E0F' }]}>Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.summaryCancelBtn, { borderColor: '#EF4444' }]}
                          onPress={() => handleCancel(selectedBooking)}
                        >
                          <Text style={[styles.summaryCancelBtnText, { color: '#EF4444' }]}>Cancel</Text>
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 4,
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  activeCountText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  dateCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    minWidth: 38,
    paddingTop: 2,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '900',
    color: '#E84E0F',
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  cardRightCol: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
    marginBottom: 4,
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
  cancelledBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  cancelledText: {
    color: '#6B7280',
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 14,
    color: '#E84E0F',
    fontWeight: '800',
  },
  cardFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#E84E0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flex: 0.6,
  },
  rebookButton: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceIconBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryPayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E84E0F',
  },
  summaryPayBtnText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  summaryCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  summaryCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  cardRescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  cardRescheduleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cardCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  cardCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  timelineContainer: {
    marginTop: 10,
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineLeftColumn: {
    alignItems: 'center',
    marginRight: 12,
    width: 18,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: '#10B981',
  },
  timelineLine: {
    width: 2,
    height: 22,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
  },
  timelineRightColumn: {
    flex: 1,
    paddingTop: 0,
  },
  timelineStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  timelineStatusTitleActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timelineTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
    fontWeight: '500',
  },
  statusBadgeContainer: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E84E0F',
  },
  bulletListContainer: {
    marginTop: 4,
    paddingLeft: 2,
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E84E0F',
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  arrivalNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 4,
    gap: 6,
  },
  arrivalNoticeText: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '700',
    flex: 1,
  },
  completedInvoiceContainer: {
    marginTop: 6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 8,
    marginBottom: 8,
  },
  invoiceLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    gap: 6,
    paddingVertical: 2,
  },
  invoiceLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#000000ff',
  },
});
  