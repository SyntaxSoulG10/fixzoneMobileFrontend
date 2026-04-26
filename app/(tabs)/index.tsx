import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from 'react-native';
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
import { MOCK_SERVICE_CENTERS, ServiceCenter } from '../../constants/mock_data';
import { filterServiceCenters, mockAiSearch, AiFilters } from '../../utils/search_utils';

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  const { pendingBookings } = useBookings();
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
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
      const data = await vehicleService.getVehiclesByUser(authUser.userId);
      setVehicles(data);
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
      <View className="flex-1 bg-white">
        <HomeHeader />
        <SearchBar 
          onFilterPress={() => setIsFilterVisible(true)} 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {isSearching ? (
            <View className="px-5 py-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">
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
              <View className="px-5 mt-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900">My Vehicles</Text>
                  {!isLoadingVehicles && vehicles.length > 0 && (
                    <TouchableOpacity 
                      className="flex-row items-center"
                      onPress={() => router.push({ pathname: '/vehicles', params: { add: 'true' } })}
                    >
                      <Text className="text-orange-500 font-bold mr-2">Add New</Text>
                      <View className="bg-orange-500 rounded-full w-6 h-6 items-center justify-center">
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
                          image={item.imageUrl || 'https://via.placeholder.com/250'}
                          name={`${item.brand || ''} ${item.model || ''}`}
                          plate={item.plateNumber}
                          lastService={item.lastServiceDate || '01/01/2026'}
                        />
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View className="items-center w-full py-4">
                    <TouchableOpacity 
                      onPress={() => router.push({ pathname: '/vehicles', params: { add: 'true' } })}
                      className="w-64 h-[210px] bg-orange-50/50 rounded-3xl border-2 border-dashed border-orange-300 items-center justify-center p-4"
                    >
                      <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-3 shadow-sm shadow-orange-200">
                        <Ionicons name="add" size={32} color="#E84E0F" />
                      </View>
                      <Text className="text-orange-900 font-bold text-base mb-1">Add New Vehicle</Text>
                      <Text className="text-orange-600/80 text-xs text-center font-medium leading-relaxed px-2">
                        Add your vehicle here for smooth bookings
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View className="px-5 mt-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900">Trusted Service Centers</Text>
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
              <View className="px-5 mt-4 mb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-bold text-gray-900">Nearby Service Centers</Text>
                  <TouchableOpacity onPress={() => router.push('/book')}>
                    <Text className="text-orange-500 font-bold">View All</Text>
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
