import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';

const { width } = Dimensions.get('window');

type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export default function ServiceCenterDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('bike'); // Default to bike based on screenshot
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      loadCenter(id);
    }
  }, [id]);

  const loadCenter = async (centerId: string) => {
    try {
      setIsLoading(true);
      const data = await serviceCenterService.getServiceCenterById(centerId);
      setCenter(data);
      if (data.supportedVehicleBrands && data.supportedVehicleBrands.length > 0) {
        // Find if screenshot type exists, else default to first
        const types = data.supportedVehicleBrands as VehicleType[];
        if (types.includes('bike')) setSelectedVehicleType('bike');
        else setSelectedVehicleType(types[0]);
      }
    } catch (err) {
      console.error('Failed to load service center:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    if (!center?.servicePackages) return [];
    return center.servicePackages.filter(pkg => pkg.vehicleType === selectedVehicleType);
  }, [center, selectedVehicleType]);

  const renderVehicleTab = (type: VehicleType) => {
    const isSelected = selectedVehicleType === type;
    let iconName: keyof typeof Ionicons.glyphMap = 'car-outline';
    if (type === 'bike') iconName = 'bicycle-outline';
    if (type === 'van') iconName = 'bus-outline';
    if (type === 'lorry') iconName = 'car-sport-outline';

    return (
      <TouchableOpacity
        key={type}
        onPress={() => setSelectedVehicleType(type)}
        style={[styles.tab, isSelected && styles.tabSelected]}
      >
        <Ionicons name={iconName} size={22} color={isSelected ? '#fff' : '#6B7280'} />
        <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!center) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#6B7280' }}>Service Center not found</Text>
      </View>
    );
  }

  const supportedVehicles = (center.supportedVehicleBrands || []) as VehicleType[];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {/* Custom Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{center.name}</Text>
          <Text style={styles.headerSubtitle}>Select Service Package</Text>
        </View>
        <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.headerIcon}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? "#EF4444" : "#1F2937"} />
        </TouchableOpacity>
      </View>

      <ScrollView stickyHeaderIndices={[1]} showsVerticalScrollIndicator={false}>
        {/* Vehicle Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
            {supportedVehicles.map(v => renderVehicleTab(v))}
          </ScrollView>
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Available Packages</Text>
        </View>

        {/* Packages List */}
        <View style={styles.packagesList}>
          {filteredPackages.length > 0 ? (
            filteredPackages.map(pkg => <PackageCard key={pkg.packageId || pkg.name} pkg={pkg} centerId={center.centerId} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No packages for this vehicle type.</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PackageCard({ pkg, centerId }: { pkg: ServicePackageDTO; centerId: string }) {
  const router = useRouter();
  
  const price = typeof pkg.price === 'number' ? pkg.price : Number(pkg.basePrice || pkg.price) || 0;
  const durationInMins = (pkg as any).estimatedDurationMins || 60;
  const durationHours = Math.floor(durationInMins / 60);
  const durationText = durationHours > 0 ? `${durationHours} hrs` : `${durationInMins} mins`;

  // Default features: split description by comma if features array is empty
  const features = useMemo(() => {
    if (pkg.features && pkg.features.length > 0) return pkg.features;
    if (pkg.description) {
      return pkg.description.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return ['Quality Service Inspection'];
  }, [pkg.features, pkg.description]);

  // Default image if none is provided by the DB
  const packagePlaceholder = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=400&auto=format&fit=crop';

  return (
    <View style={styles.pkgCard}>
      {/* Package Image */}
      <Image 
        source={{ uri: pkg.imageUrl || packagePlaceholder }} 
        style={styles.pkgImage} 
      />
      
      <View style={styles.pkgBody}>
        {/* Title and Price */}
        <View style={styles.pkgHeaderRow}>
          <Text style={styles.pkgName}>{pkg.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.pkgPrice}>LKR {price.toLocaleString()}</Text>
            <Text style={styles.estimatedText}>Estimated</Text>
          </View>
        </View>

        {/* Duration */}
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={16} color="#4B5563" />
          <Text style={styles.durationText}>{durationText}</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {features.slice(0, 3).map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          {features.length > 3 && (
            <Text style={styles.moreText}>+{features.length - 3} more</Text>
          )}
        </View>

        {/* Book Button */}
        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/booking/create', params: { centerId, packageId: pkg.packageId || '', packageName: pkg.name } })}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // Dynamic top margin for Android status bar
  },
  headerIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tabsWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 16,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    minWidth: 100,
  },
  tabSelected: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabTextSelected: {
    color: '#fff',
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  packagesList: {
    paddingHorizontal: 16,
  },
  pkgCard: {
    backgroundColor: '#FFF5F0', // Cream background
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  pkgImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  pkgBody: {
    padding: 20,
  },
  pkgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pkgName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  pkgPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  estimatedText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  durationText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  featuresList: {
    marginTop: 16,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  moreText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '700',
    marginLeft: 28,
    marginTop: 2,
  },
  bookBtn: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
