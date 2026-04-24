import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import { MOCK_SERVICE_CENTERS } from '../../constants/mock_data';
import { COLORS } from '../../constants/colors';

const FILTERS = ['Near me', 'Top Rated', 'Open Now', 'Premium', 'Fastest'];

export default function BookScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Near me');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    serviceType: '',
    availability: '',
  });

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

  return (
    <View style={styles.container}>
      {/* Fixed Header and Search */}
      <HomeHeader />
      <SearchBar onFilterPress={() => setIsFilterVisible(true)} />

      {/* Horizontal Chip Filters */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.chip,
                selectedFilter === filter ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedFilter === filter ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Service Centers List */}
      <FlatList
        data={MOCK_SERVICE_CENTERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ServiceCenterCard {...item} variant="premium" />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Premium Centers</Text>
              <Text style={styles.sectionSubtitle}>Handpicked for Quality assurance</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewMapText}>View Map</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chipsContainer: {
    paddingVertical: 12,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
  },
  chipUnselected: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipTextUnselected: {
    color: '#6B7280',
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
  viewMapText: {
    fontSize: 14,
    color: '#E84E0F',
    fontWeight: '700',
  },
  cardWrapper: {
    marginBottom: 0,
  },
});
