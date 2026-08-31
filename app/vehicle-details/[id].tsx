import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_BOOKINGS } from '../../constants/mock_data';
import { COLORS } from '../../constants/colors';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { bookingService, BookingResponseDTO } from '../../services/bookingService';
import { useAuth } from '../../context/auth_context';
import { getDaysSinceService, getLastServiceDate } from '../../utils/date_utils';
import { getVehicleIcon } from '../../utils/vehicle_utils';

const { width } = Dimensions.get('window');


export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: authUser } = useAuth();

  const handleBack = () => {
    router.replace('/(tabs)/vehicles');
  };

  const [vehicle, setVehicle] = React.useState<VehicleResponse | null>(null);
  const [vehicleHistory, setVehicleHistory] = React.useState<BookingResponseDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!authUser?.userId || !id) return;
      try {
        setIsLoading(true);
        // Fetch vehicle
        const vehicles = await vehicleService.getVehiclesByUser(authUser.userId);
        const found = vehicles.find(v => v.id === id);
        if (found) setVehicle(found);

        // Fetch bookings
        const bookings = await bookingService.getBookingsByCustomer(authUser.userId);
        const vehicleBookings = bookings.filter(b => b.vehicleId === id && b.status !== 'PENDING_PAYMENT');
        setVehicleHistory(vehicleBookings);
      } catch (e) {
        console.error('Error fetching vehicle details', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, authUser?.userId]);

  const lastServiceDate = React.useMemo(() => {
    if (!id) return vehicle?.lastServiceDate || '';
    return getLastServiceDate(id as string, vehicleHistory, vehicle?.lastServiceDate);
  }, [id, vehicleHistory, vehicle]);

  const daysSince = getDaysSinceService(lastServiceDate);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text>Vehicle not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Vehicle Identity */}
        <View style={styles.imageContainer}>
          {vehicle.imageUrl ? (
            <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} />
          ) : (
            <View style={[styles.vehicleImage, styles.vectorPlaceholderLarge]}>
              <Ionicons name={getVehicleIcon(vehicle.vehicleType)} size={120} color="#F97316" />
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
          <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Days Since</Text>
              <Text style={styles.statValue}>{daysSince !== undefined ? daysSince : 'N/A'}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Last Service</Text>
              <Text style={styles.statValue}>{lastServiceDate || 'N/A'}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Total Services</Text>
              <Text style={styles.statValue}>{vehicleHistory.filter(b => b.status === 'COMPLETED').length}</Text>
            </View>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Service History</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {vehicleHistory.length > 0 ? (
            vehicleHistory.map((item) => {
              const getStatusStyle = (status: string) => {
                switch (status) {
                  case 'COMPLETED':
                    return { bg: '#D1FAE5', text: '#10B981', icon: 'checkmark-done-circle', iconColor: '#10B981' };
                  case 'IN_PROGRESS':
                    return { bg: '#DBEAFE', text: '#2563EB', icon: 'construct', iconColor: '#2563EB' };
                  case 'CONFIRMED':
                    return { bg: '#FFF7ED', text: '#C2410C', icon: 'checkmark-circle', iconColor: '#E84E0F' };
                  case 'PENDING':
                  case 'PENDING_PAYMENT':
                    return { bg: '#FEE2E2', text: '#EF4444', icon: 'time', iconColor: '#EF4444' };
                  case 'CANCELLED':
                    return { bg: '#F3F4F6', text: '#6B7280', icon: 'close-circle', iconColor: '#6B7280' };
                  default:
                    return { bg: '#F3F4F6', text: '#64748B', icon: 'information-circle', iconColor: '#64748B' };
                }
              };

              const statusConfig = getStatusStyle(item.status);
              const statusText = item.status === 'CONFIRMED' 
                ? 'READY FOR SERVICE' 
                : item.status.replace(/_/g, ' ').toUpperCase();

              return (
                <View key={item.bookingId} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: statusConfig.bg }]}>
                    <Ionicons
                      name={statusConfig.icon as any}
                      size={20}
                      color={statusConfig.iconColor}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyType} numberOfLines={1}>{item.packageName || 'Service'}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.historyPriceContainer}>
                    <Text style={styles.historyPrice}>
                      LKR {(item.estimatedCost || 0).toLocaleString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>No service history found for this vehicle.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push({ pathname: '/(tabs)/book', params: { vehicleId: vehicle.id } })}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.bookButtonText}>Book New Service</Text>
        </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: -2,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#fff',
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vectorPlaceholderLarge: {
    width: width,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  daysBadge: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    alignItems: 'flex-end',
  },
  daysBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EA580C',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  daysBadgeTitle: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '800',
    marginTop: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  vehicleName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statCard: {
    width: (width - 60) / 3,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    marginTop: 4,
  },
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  historyPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  historyPriceContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyHistory: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E84E0F',
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
