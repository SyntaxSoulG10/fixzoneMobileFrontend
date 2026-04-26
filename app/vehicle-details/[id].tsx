import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_BOOKINGS } from '../../constants/mock_data';
import { COLORS } from '../../constants/colors';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { useAuth } from '../../context/auth_context';

const { width } = Dimensions.get('window');

const getDaysSinceService = (dateString: string) => {
  if (!dateString) return 0;
  const parts = dateString.split('/');
  if (parts.length !== 3) return 0;
  const serviceDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  const diffTime = today.getTime() - serviceDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [vehicle, setVehicle] = React.useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchVehicle = async () => {
      if (!authUser?.userId || !id) return;
      try {
        const data = await vehicleService.getVehiclesByUser(authUser.userId);
        const found = data.find(v => v.id === id);
        if (found) setVehicle(found);
      } catch (e) {
        console.error('Error fetching vehicle details', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicle();
  }, [id, authUser?.userId]);

  const vehicleHistory = MOCK_BOOKINGS.filter(b => b.vehicleId === id);
  
  const daysSince = vehicle ? getDaysSinceService(vehicle.lastServiceDate || '') : 0;

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
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Vehicle Identity */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: vehicle.imageUrl || 'https://via.placeholder.com/250' }} style={styles.vehicleImage} />
          <View style={styles.daysBadge}>
            <Text style={styles.daysBadgeText}>{daysSince} days</Text>
            <Text style={styles.daysBadgeTitle}>since service</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.model}</Text>
          <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flash-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Fuel Type</Text>
              <Text style={styles.statValue}>Petrol</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Last Service</Text>
              <Text style={styles.statValue}>{vehicle.lastServiceDate || 'N/A'}</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Total Services</Text>
              <Text style={styles.statValue}>{vehicleHistory.length}</Text>
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
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-done" size={20} color="#10B981" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>Full Service</Text>
                  <Text style={styles.historyDate}>{item.month} {item.date}, {item.year}</Text>
                </View>
                <Text style={styles.historyPrice}>LKR {item.totalPrice.toLocaleString()}</Text>
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
    width: width,
    height: 250,
    position: 'relative',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  daysBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
    padding: 20,
  },
  vehicleName: {
    fontSize: 28,
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
    marginTop: 25,
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
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
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
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 10,
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
