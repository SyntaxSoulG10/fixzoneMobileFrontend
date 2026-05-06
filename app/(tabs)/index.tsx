import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import VehicleCard from '../../components/home/VehicleCard';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import NoResults from '../../components/home/NoResults';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import { useBookings } from '../../context/BookingContext';
import { useAuth } from '../../context/auth_context';
import { vehicleService, VehicleResponse } from '../../services/vehicleService';
import { bookingService } from '../../services/bookingService';
import { MOCK_SERVICE_CENTERS, ServiceCenter } from '../../constants/mock_data';
import { filterServiceCenters, mockAiSearch, AiFilters } from '../../utils/search_utils';
import { getDaysSinceService } from '../../utils/date_utils';

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  const { pendingBookings } = useBookings();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [vehicleLastServiceMap, setVehicleLastServiceMap] = useState<Record<string, string>>({});
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    serviceType: '',
    availability: '',
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceCenter[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!authUser?.userId) return;
    try {
      setIsLoadingVehicles(true);
      const [vehicleData, bookingData] = await Promise.all([
        vehicleService.getVehiclesByUser(authUser.userId),
        bookingService.getBookingsByCustomer(authUser.userId)
      ]);
      
      setVehicles(vehicleData);

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
    }, [fetchVehicles])
  );

  const router = useRouter();

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterVisible(false);
    // Logic to filter the list could go here
    console.log('Applied Filters:', newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      distance: '',
      vehicleType: '',
      serviceType: '',
      availability: '',
    });
  };

  // 1. Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Search Execution Logic
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const isComplex = debouncedQuery.trim().split(' ').length > 1;
      
      let aiFilters: AiFilters | undefined;
      if (isComplex) {
        setIsAiProcessing(true);
        aiFilters = await mockAiSearch(debouncedQuery);
        setIsAiProcessing(false);
      }

      const results = filterServiceCenters(debouncedQuery, MOCK_SERVICE_CENTERS, aiFilters);
      setSearchResults(results);
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <HomeHeader />
        <SearchBar 
          onFilterPress={() => setIsFilterVisible(true)} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView style={styles.flex1} showsVerticalScrollIndicator={false}>
          {isSearching ? (
            <View style={styles.searchContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {isAiProcessing ? 'AI is analyzing...' : `Results for "${debouncedQuery}"`}
                </Text>
                {isAiProcessing && <ActivityIndicator color="#E84E0F" size="small" />}
              </View>

              {searchResults.length > 0 ? (
                searchResults.map(center => (
                  <ServiceCenterCard 
                    key={`search-${center.id}`}
                    {...center}
                    variant="compact"
                  />
                ))
              ) : !isAiProcessing ? (
                <NoResults query={debouncedQuery} onReset={() => setSearchQuery('')} />
              ) : null}
            </View>
          ) : (
            <>
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
                
                {MOCK_SERVICE_CENTERS.slice(0, 2).map(center => (
                  <ServiceCenterCard 
                    key={center.id}
                    {...center}
                    variant="compact"
                  />
                ))}
              </View>

              {/* Nearby Service Centers Section */}
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nearby Service Centers</Text>
                  <TouchableOpacity onPress={() => router.push('/book')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                {MOCK_SERVICE_CENTERS.slice(2).map(center => (
                  <ServiceCenterCard 
                    key={`nearby-${center.id}`}
                    {...center}
                    variant="compact"
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <FilterBottomSheet
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          initialFilters={filters}
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
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  addVehiclePlaceholder: {
    width: 256,
    height: 210,
    backgroundColor: 'rgba(255, 247, 237, 0.5)',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FDBA74',
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
