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
            vehicleHistory.map((item, index) => (
              <View key={item.bookingId} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons 
                    name={item.status === 'COMPLETED' ? "checkmark-done" : "time-outline"} 
                    size={20} 
                    color={item.status === 'COMPLETED' ? "#10B981" : "#F59E0B"} 
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>{item.packageName || 'Service'}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.historyPriceContainer}>
                  <Text style={styles.historyPrice}>
                    LKR {(item.estimatedCost || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.historyStatus, { color: item.status === 'COMPLETED' ? "#10B981" : "#F59E0B" }]}>
                    {item.status === 'CONFIRMED' ? 'Ready for Service' : item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>No service history found for this vehicle.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push('/(tabs)/book')}
        >
          <Text style={styles.bookButtonText}>Book New Service</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  historyStatus: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
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
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 5,
    elevation: 4,
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 10,
  },
});
