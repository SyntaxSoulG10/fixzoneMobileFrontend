import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import VehicleCard from '../../components/home/VehicleCard';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import { MOCK_VEHICLES, MOCK_SERVICE_CENTERS } from '../../constants/mock_data';

export default function HomeScreen() {
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterState>({
    distance: '',
    vehicleType: '',
    serviceType: '',
    availability: '',
  });

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
    console.log('Filters Reset');
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <HomeHeader />
        <SearchBar onFilterPress={() => setIsFilterVisible(true)} />
        <PromoBanner />

      {/* My Vehicles Section */}
      <View className="px-5 mt-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">My Vehicles</Text>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-orange-500 font-bold mr-1">Add New</Text>
            <View className="bg-orange-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white font-bold">+</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={MOCK_VEHICLES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VehicleCard 
              image={item.image}
              name={item.name}
              plate={item.plate}
              status={item.status}
              lastService={item.lastService}
            />
          )}
        />
      </View>

      {/* Trusted Service Centers Section */}
      <View className="px-5 mt-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Trusted Service Centers</Text>
          <TouchableOpacity>
            <Text className="text-orange-500 font-bold">View All</Text>
          </TouchableOpacity>
        </View>
        
        {MOCK_SERVICE_CENTERS.slice(0, 2).map(center => (
          <ServiceCenterCard 
            key={center.id}
            image={center.image}
            name={center.name}
            location={center.location}
            type={center.type}
            distance={center.distance}
          />
        ))}
      </View>

      {/* Nearby Service Centers Section */}
      <View className="px-5 mt-4 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">Nearby Service Centers</Text>
          <TouchableOpacity>
            <Text className="text-orange-500 font-bold">View All</Text>
          </TouchableOpacity>
        </View>
        
        {MOCK_SERVICE_CENTERS.slice(2, 4).map(center => (
          <ServiceCenterCard 
            key={`nearby-${center.id}`}
            image={center.image}
            name={center.name}
            location={center.location}
            type={center.type}
            distance={center.distance}
          />
        ))}
      </View>
    </ScrollView>

      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        initialFilters={filters}
      />
    </View>
  );
}
