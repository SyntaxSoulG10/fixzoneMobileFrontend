import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';

const { width } = Dimensions.get('window');

type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export default function ServiceCenterDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('car');

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
      // Set default tab to first supported vehicle type
      if (data.supportedVehicleBrands && data.supportedVehicleBrands.length > 0) {
        setSelectedVehicleType(data.supportedVehicleBrands[0] as VehicleType);
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

  const isOpen = () => {
    if (!center?.openingHours) return false;
    try {
      const parts = center.openingHours.split('-').map(s => s.trim());
      if (parts.length < 2) return false;
      const [openH, openM] = parts[0].split(':').map(Number);
      const [closeH, closeM] = parts[1].split(':').map(Number);
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      return current >= (openH * 60 + openM) && current <= (closeH * 60 + closeM);
    } catch {
      return false;
    }
  };

  const handleCall = () => {
    if (center?.contactPhone) Linking.openURL(`tel:${center.contactPhone}`);
  };

  const handleDirection = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${center?.name}@6.9271,79.8612`,
      android: `geo:0,0?q=6.9271,79.8612(${center?.name})`,
    });
    if (url) Linking.openURL(url);
  };

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
        <Ionicons name={iconName} size={24} color={isSelected ? '#fff' : '#6B7280'} />
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
        <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading service center...</Text>
      </View>
    );
  }

  if (!center) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Service Center not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#F97316' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openStatus = isOpen();
  const supportedVehicles = (center.supportedVehicleBrands || []) as VehicleType[];

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        {center.imageUrl ? (
          <Image source={{ uri: center.imageUrl }} style={styles.headerImage} resizeMode="cover" />
        ) : (
          <View style={[styles.headerImage, { backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="car-sport-outline" size={64} color="#374151" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,20,0.9)']}
          style={styles.imageGradient}
        />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerOverlay}>
          <Text style={styles.centerName}>{center.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.locationText}>{center.address}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: openStatus ? '#065F46' : '#7F1D1D' }]}>
              <View style={[styles.statusDot, { backgroundColor: openStatus ? '#34D399' : '#EF4444' }]} />
              <Text style={[styles.statusText, { color: openStatus ? '#34D399' : '#EF4444' }]}>
                {openStatus ? 'Open Now' : 'Closed'}
              </Text>
            </View>
            {center.openingHours && (
              <Text style={styles.hoursText}>{center.openingHours}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={20} color="#F97316" />
          <Text style={styles.actionBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDirection}>
          <Ionicons name="navigate-outline" size={20} color="#F97316" />
          <Text style={styles.actionBtnText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${center.contactPhone}`)}>
          <Ionicons name="share-social-outline" size={20} color="#F97316" />
          <Text style={styles.actionBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Type Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {supportedVehicles.map(v => renderVehicleTab(v))}
      </ScrollView>

      {/* Packages List */}
      <ScrollView style={styles.packagesList} showsVerticalScrollIndicator={false}>
        {filteredPackages.length > 0 ? (
          filteredPackages.map(pkg => <PackageCard key={pkg.id || pkg.name} pkg={pkg} centerId={center.centerId} />)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={40} color="#374151" />
            <Text style={styles.emptyStateText}>No packages for this vehicle type.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function PackageCard({ pkg, centerId }: { pkg: ServicePackageDTO; centerId: string }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const price = typeof pkg.price === 'number' ? pkg.price : Number(pkg.price) || 0;
  const duration = pkg.duration || (pkg as any).estimatedDurationMins
    ? `${(pkg as any).estimatedDurationMins || pkg.duration} mins`
    : '';

  return (
    <View style={styles.pkgCard}>
      <View style={styles.pkgInfo}>
        <View style={styles.pkgTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pkgTitle}>{pkg.name}</Text>
            {duration ? (
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text style={styles.durationText}>{duration}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.pkgPriceCol}>
            <Text style={styles.pkgPrice}>LKR {price.toLocaleString()}</Text>
            <Text style={styles.pkgPriceSub}>Estimated</Text>
          </View>
        </View>

        {pkg.features && pkg.features.length > 0 ? (
          <>
            {(isExpanded ? pkg.features : pkg.features.slice(0, 2)).map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={14} color="#34D399" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
            {pkg.features.length > 2 && (
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.showMore}>{isExpanded ? 'Show Less' : `+${pkg.features.length - 2} more`}</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          pkg.description ? (
            <Text style={styles.pkgDescription}>{pkg.description}</Text>
          ) : null
        )}

        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/booking/create', params: { centerId, packageId: pkg.id || '', packageName: pkg.name } })}
        >
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  imageContainer: { height: 280, position: 'relative' },
  headerImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  backButton: {
    position: 'absolute', top: 48, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  headerOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  centerName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 13, color: '#9CA3AF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  hoursText: { fontSize: 12, color: '#6B7280' },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#1A1A2E', borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#2D2D44',
  },
  actionBtnText: { color: '#F97316', fontSize: 13, fontWeight: '600' },
  tabScroll: { maxHeight: 72 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#2D2D44',
  },
  tabSelected: { backgroundColor: '#F97316', borderColor: '#F97316' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  tabTextSelected: { color: '#fff' },
  packagesList: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyStateText: { color: '#6B7280', fontSize: 14 },
  pkgCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#2D2D44', overflow: 'hidden',
  },
  pkgInfo: { padding: 16 },
  pkgTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  pkgTitle: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  durationText: { fontSize: 11, color: '#6B7280' },
  pkgPriceCol: { alignItems: 'flex-end' },
  pkgPrice: { fontSize: 15, fontWeight: '700', color: '#F97316' },
  pkgPriceSub: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  featureText: { fontSize: 13, color: '#D1D5DB' },
  showMore: { color: '#F97316', fontSize: 12, marginTop: 4 },
  pkgDescription: { fontSize: 13, color: '#9CA3AF', lineHeight: 20, marginBottom: 8 },
  bookBtn: {
    marginTop: 14, backgroundColor: '#F97316', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
