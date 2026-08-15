import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import VehicleCard from '../../components/home/VehicleCard';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import { useBookings } from '../../context/BookingContext';
import { useAuth } from '../../context/auth_context';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { serviceCenterService, ServiceCenterDTO } from '../../services/serviceCenterService';
import { getDaysSinceService } from '../../utils/date_utils';
import * as Location from 'expo-location';
import { calculateDistance } from '../../utils/location_utils';
import { applyFilters, extractFilterOptions } from '../../utils/filter_utils';

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  const { pendingBookings } = useBookings();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [vehicleLastServiceMap, setVehicleLastServiceMap] = useState<Record<string, string>>({});
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [trustedCenters, setTrustedCenters] = useState<ServiceCenterDTO[]>([]);
  const [isLoadingTrusted, setIsLoadingTrusted] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    serviceType: '',
    availability: '',
  });

  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const hasFetchedVehicles = useRef(false);
  const hasFetchedTrusted = useRef(false);
  const [nearbyCenters, setNearbyCenters] = useState<ServiceCenterDTO[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied.');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      } catch (e) {
        console.error('Error requesting location:', e);
      }
    };
    fetchLocation();
  }, []);

  const fetchNearbyCenters = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoadingNearby(true);
      setNearbyError(null);
      const res = await serviceCenterService.getNearbyServiceCenters(lat, lng, 15, 0, 10);
      setNearbyCenters(res.content);
    } catch (e) {
      console.error('Failed to fetch nearby centers', e);
      setNearbyError('Unable to load service centers.');
    } finally {
      setIsLoadingNearby(false);
    }
  }, []);

  useEffect(() => {
    if (!authUser?.userId) return;
    if (userLocation) {
      fetchNearbyCenters(userLocation.coords.latitude, userLocation.coords.longitude);
    } else if (userLocation === null && !isLocationLoading) {
      // If location denied or unavailable, fetch all centers instead of nearby
      // (Or we can just show empty / fallback message)
    }
  }, [userLocation, fetchNearbyCenters, authUser?.userId]);

  const fetchTrustedCenters = useCallback(async () => {
    if (!authUser?.userId) return;
    try {
      if (!hasFetchedTrusted.current) {
        setIsLoadingTrusted(true);
      }
      const data = await serviceCenterService.getTrustedCenters(authUser.userId);
      setTrustedCenters(data);
      hasFetchedTrusted.current = true;
    } catch (e) {
      console.error('Failed to fetch trusted centers', e);
    } finally {
      setIsLoadingTrusted(false);
    }
  }, [authUser?.userId]);

  const fetchVehicles = useCallback(async () => {
    if (!authUser?.userId) return;
    try {
      if (!hasFetchedVehicles.current) {
        setIsLoadingVehicles(true);
      }
      const [vehicleData, bookingData] = await Promise.all([
        vehicleService.getVehiclesByUser(authUser.userId),
        bookingService.getBookingsByCustomer(authUser.userId)
      ]);

      setVehicles(vehicleData);
      hasFetchedVehicles.current = true;

      // Calculate last service date for each vehicle from bookings
      const serviceMap: Record<string, string> = {};
      vehicleData.forEach(vehicle => {
        const vehicleBookings = bookingData
          .filter(b => b.vehicleId === vehicle.id && b.status === 'COMPLETED')
          .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

        if (vehicleBookings.length > 0) {
          serviceMap[vehicle.id] = vehicleBookings[0].bookingDate;
        } else {
          serviceMap[vehicle.id] = vehicle.lastServiceDate || '';
        }
      });
      setVehicleLastServiceMap(serviceMap);
    } catch (e) {
      console.error('Failed to fetch vehicles', e);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [authUser?.userId]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
      fetchTrustedCenters();
      if (authUser?.userId && userLocation) {
        fetchNearbyCenters(userLocation.coords.latitude, userLocation.coords.longitude);
      }
    }, [fetchVehicles, fetchTrustedCenters, userLocation, fetchNearbyCenters, authUser?.userId])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchVehicles(),
      fetchTrustedCenters(),
      (authUser?.userId && userLocation) ? fetchNearbyCenters(userLocation.coords.latitude, userLocation.coords.longitude) : Promise.resolve()
    ]);
    setIsRefreshing(false);
  }, [fetchVehicles, fetchTrustedCenters, userLocation, fetchNearbyCenters, authUser?.userId]);

  const router = useRouter();

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterVisible(false);
  };

  const handleResetFilters = () => {
    setFilters({
      distance: '',
      vehicleType: '',
      serviceType: '',
      availability: '',
    });
  };

  // Compute dynamic filters based on real data
  const allHomeCenters = useMemo(() => {
    const combined = [...nearbyCenters];
    trustedCenters.forEach(tc => {
      if (!combined.some(c => c.centerId === tc.centerId)) {
        combined.push(tc);
      }
    });
    return combined;
  }, [nearbyCenters, trustedCenters]);

  const { availableVehicles, availableServices } = useMemo(() => {
    return extractFilterOptions(allHomeCenters);
  }, [allHomeCenters]);

  // Filter nearby & trusted lists
  const filteredNearbyCenters = useMemo(() => {
    return applyFilters(nearbyCenters, filters, '', userLocation);
  }, [nearbyCenters, filters, userLocation]);

  const filteredTrustedCenters = useMemo(() => {
    return applyFilters(trustedCenters, filters, '', userLocation);
  }, [trustedCenters, filters, userLocation]);

  const getCentersWithDistance = <T extends any>(centers: T[]): T[] => {
    if (!userLocation) return centers;

    return [...centers].map((center: any) => {
      if (center.latitude && center.longitude) {
        const dist = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          center.latitude,
          center.longitude
        );
        return { ...center, calculatedDistance: dist };
      }
      return center;
    }).sort((a: any, b: any) => {
      const distA = a.calculatedDistance ?? Infinity;
      const distB = b.calculatedDistance ?? Infinity;
      return distA - distB;
    });
  };

  const sortedTrustedCenters = getCentersWithDistance(filteredTrustedCenters);
  const sortedNearbyCenters = useMemo(() => {
    return getCentersWithDistance(filteredNearbyCenters);
  }, [filteredNearbyCenters, userLocation]);

  // Now nearbyCenters comes from the API and is already sorted by distance!
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <HomeHeader />
        <SearchBar
          onFilterPress={() => setIsFilterVisible(true)}
          value=""
          onChangeText={() => { }}
          onFocus={() => {
            router.push({ pathname: '/book', params: { focus: 'true' } });
          }}
        />
        <ScrollView
          style={styles.flex1}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#E84E0F']} />}
        >
          <PromoBanner pendingBookings={pendingBookings} />

          {/* My Vehicles Section */}
          <View style={styles.vehiclesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Vehicles</Text>
              {!isLoadingVehicles && vehicles.length > 0 && (
                <TouchableOpacity
                  style={styles.rowCenter}
                  onPress={() => router.push({ pathname: '/vehicles', params: { add: 'true' } })}
                >
                  <Text style={styles.addText}>Add New</Text>
                  <View style={styles.addButtonCircle}>
                    <Ionicons name="add" size={18} color="white" />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {isLoadingVehicles ? (
              <ActivityIndicator color="#E84E0F" />
            ) : vehicles.length > 0 ? (
              <FlatList
                data={vehicles}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => router.push(`/vehicle-details/${item.id}`)}>
                    <VehicleCard
                      image={item.imageUrl || ''}
                      name={`${item.brand || ''} ${item.model || ''}`}
                      plate={item.plateNumber}
                      type={item.vehicleType}
                      lastService={vehicleLastServiceMap[item.id] || item.lastServiceDate || 'N/A'}
                    />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyVehiclesContainer}>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/vehicles', params: { add: 'true' } })}
                  style={styles.addVehiclePlaceholder}
                >
                  <View style={styles.addPlaceholderIconContainer}>
                    <Ionicons name="add" size={32} color="#E84E0F" />
                  </View>
                  <Text style={styles.addPlaceholderTitle}>Add New Vehicle</Text>
                  <Text style={styles.addPlaceholderSubtitle}>
                    Add your vehicle here for smooth bookings
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.trustedSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trusted Service Centers</Text>
            </View>

            {isLoadingTrusted ? (
              <ActivityIndicator color="#E84E0F" />
            ) : sortedTrustedCenters.length > 0 ? (
              <FlatList
                data={sortedTrustedCenters}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.centerId || Math.random().toString()}
                contentContainerStyle={{ paddingRight: 20 }}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                renderItem={({ item }: { item: any }) => (
                  <ServiceCenterCard
                    {...item}
                    id={item.centerId}
                    location={item.address || ''}
                    calculatedDistance={item.calculatedDistance}
                    hideServedFor={true}
                  />
                )}
              />
            ) : (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 10 }}>
                You haven't visited any service centers yet.
              </Text>
            )}
          </View>

          {/* Nearby Service Centers Section */}
          <View style={styles.nearbySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Service Centers</Text>
              <TouchableOpacity onPress={() => router.push('/book')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {isLoadingNearby ? (
              <ActivityIndicator color="#E84E0F" size="large" style={{ marginVertical: 20 }} />
            ) : nearbyError ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#EF4444', marginBottom: 10 }}>{nearbyError}</Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#E84E0F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                  onPress={() => userLocation && fetchNearbyCenters(userLocation.coords.latitude, userLocation.coords.longitude)}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : sortedNearbyCenters.length > 0 ? (
              sortedNearbyCenters.map((center: any) => (
                <ServiceCenterCard
                  key={`nearby-${center.centerId}`}
                  {...center}
                  id={center.centerId}
                  location={center.address || ''}
                  variant="compact"
                  calculatedDistance={center.calculatedDistance}
                />
              ))
            ) : (
              <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 10 }}>
                {nearbyCenters.length > 0
                  ? "No service centers match your filters."
                  : (!userLocation ? "Location access needed to find nearby centers." : "No service centers found within 15 km.")}
              </Text>
            )}
          </View>
        </ScrollView>

        <FilterBottomSheet
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          initialFilters={filters}
          availableVehicles={availableVehicles}
          availableServices={availableServices}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex1: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  vehiclesSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addText: {
    color: '#F97316',
    fontWeight: 'bold',
    marginRight: 8,
  },
  addButtonCircle: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVehiclesContainer: {
    paddingVertical: 12,
  },
  quickFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  quickFilterChipActive: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
  },
  quickFilterText: {
    marginLeft: 4,
    color: '#E84E0F',
    fontWeight: '600',
    fontSize: 12,
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  addVehiclePlaceholder: {
    width: 256,
    height: 210,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addPlaceholderIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FFEDD5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FED7AA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addPlaceholderTitle: {
    color: '#7C2D12',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  addPlaceholderSubtitle: {
    color: 'rgba(234, 88, 12, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  trustedSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  nearbySection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 32,
  },
  viewAllText: {
    color: '#F97316',
    fontWeight: 'bold',
  },
});
