import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import NoResults from '../../components/home/NoResults';
import { COLORS } from '../../constants/colors';
import { serviceCenterService, ServiceCenterDTO } from '../../services/serviceCenterService';
import * as Location from 'expo-location';
import { calculateDistance } from '../../utils/location_utils';
import { applyFilters, extractFilterOptions } from '../../utils/filter_utils';

export default function BookScreen() {
  const { focus, search } = useLocalSearchParams<{ focus?: string; search?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenterDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    serviceType: '',
    availability: '',
  });

  const searchBarRef = useRef<TextInput>(null);

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

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
        }
      } catch (e) {
        console.error('Error requesting location:', e);
      }
    };
    fetchLocation();
    fetchCenters();
  }, []);

  useEffect(() => {
    if (search !== undefined) {
      setSearchQuery(search);
    }
    if (focus === 'true') {
      const timer = setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [focus, search]);

  const fetchCenters = async () => {
    try {
      setIsLoading(true);
      const data = await serviceCenterService.getAllServiceCenters();
      setServiceCenters(data.content);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract dynamic filters
  const { availableVehicles, availableServices } = useMemo(() => {
    return extractFilterOptions(serviceCenters);
  }, [serviceCenters]);

  // Apply filters
  const filteredServiceCenters = useMemo(() => {
    return applyFilters(serviceCenters, filters, searchQuery, userLocation);
  }, [serviceCenters, filters, searchQuery, userLocation]);

  const renderServiceCenter = ({ item }: { item: ServiceCenterDTO }) => {
    // Map DTO to Card Props
    const priceFrom = item.servicePackages && item.servicePackages.length > 0 
      ? Math.min(...item.servicePackages.map(p => p.price || p.basePrice || 0).filter(p => p > 0)) 
      : 0;
      
    const openUntil = item.openingHours && item.openingHours.includes('-') 
      ? item.openingHours.split('-')[1].trim() 
      : '18:00';

    return (
      <View style={styles.cardWrapper}>
        <ServiceCenterCard 
          id={item.centerId}
          name={item.name}
          location={item.address}
          type="General Service" // Default type
          image={item.imageUrl}
          priceFrom={priceFrom}
          openingHours={item.openingHours}
          isVerified={item.isActive}
          supportedVehicles={(item.supportedVehicleBrands as any) || ['car', 'van']} 
          variant="premium"
          calculatedDistance={
            item.latitude && item.longitude && userLocation
              ? calculateDistance(
                  userLocation.coords.latitude,
                  userLocation.coords.longitude,
                  item.latitude,
                  item.longitude
                )
              : undefined
          }
        />
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Fixed Header and Search */}
        <HomeHeader />
        <SearchBar 
          ref={searchBarRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setIsFilterVisible(true)} 
        />


        {/* Service Centers List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredServiceCenters}
            keyExtractor={(item) => item.centerId}
            renderItem={renderServiceCenter}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Service Centers</Text>
                  <Text style={styles.sectionSubtitle}>Handpicked for Quality assurance</Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <NoResults 
                query={searchQuery || 'selected filters'} 
                onReset={() => {
                  setSearchQuery('');
                  handleResetFilters();
                }} 
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}

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
    backgroundColor: '#fff',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  cardWrapper: {
    marginBottom: 0,
  },
});
