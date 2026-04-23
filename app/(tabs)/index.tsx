import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import PromoBanner from '../../components/home/PromoBanner';
import VehicleCard from '../../components/home/VehicleCard';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import { COLORS } from '../../constants/colors';

// Temporary mock data (will move to mock_data.ts in next step)
const MOCK_VEHICLES = [
  {
    id: '1',
    name: 'Honda Vezel',
    plate: 'WP BCY 9454',
    status: 'Service Due',
    lastService: '06/02/2026',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Honda Vezel',
    plate: 'WP BCY 9454',
    status: 'Up to date',
    lastService: '06/02/2026',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=500&auto=format&fit=crop'
  }
];

const MOCK_CENTERS = [
  {
    id: '1',
    name: 'AutoMiraj',
    location: 'Colombo 07',
    type: 'Hybrid Specialist',
    distance: '2.4 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'CarCare Hub',
    location: 'Kandy 02',
    type: 'Hybrid Specialist',
    distance: '24 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  }
];

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <HomeHeader />
      <SearchBar />
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
        
        {MOCK_CENTERS.map(center => (
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
        
        {MOCK_CENTERS.map(center => (
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
  );
}
