import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform, ActivityIndicator, SafeAreaView, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';
import StatusBadge from '../../components/ui/StatusBadge';
import * as Clipboard from 'expo-clipboard';
import { openDirections } from '../../utils/location_utils';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export default function ServiceCenterDetails() {
  const { id, distance, from } = useLocalSearchParams<{ id: string; distance?: string; from?: string }>();
  const router = useRouter();

  const handleBack = () => {
    router.replace('/(tabs)/book');
  };

  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to load service center:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!center) return;
    try {
      const message = `Check out ${center.name} on FixZone!\n📍 Located at: ${center.address || 'Colombo'}\nBook your vehicle service today!`;
      await Share.share({
        message: message,
        title: `Book a service at ${center.name}`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share this service center.');
    }
  };

  const handleCall = async () => {
    if (!center || !center.contactPhone) {
      Alert.alert('Not Available', 'Phone number is not available for this service center.');
      return;
    }
    const phoneNumber = `tel:${center.contactPhone}`;
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Alert.alert('Error', 'Your device does not support making phone calls.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the phone dialer.');
    }
  };

  const handleDirection = async () => {
    if (!center) return;
    if (center.latitude && center.longitude) {
      await openDirections(center.latitude, center.longitude, center.name);
    } else {
      Alert.alert('Location Unavailable', 'Exact GPS coordinates are not available for this center yet.');
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {/* Custom Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
          <Ionicons name="chevron-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{center.name}</Text>
          <Text style={styles.headerSubtitle}>Select Service Package</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: center.imageUrl || 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=800&auto=format&fit=crop' }} 
            style={styles.heroImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>{center.name}</Text>
            <Text style={styles.heroSubtitle}>
              {center.address 
                ? center.address.split(',').slice(0, 4).join(',').trim() 
                : 'Colombo'} 
              {distance ? `  |  ${distance} km away` : ''}
            </Text>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="call" size={18} color="#111827" />
              </View>
              <Text style={styles.actionBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="share-social" size={18} color="#111827" />
              </View>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleDirection}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="navigate" size={18} color="#111827" />
              </View>
              <Text style={styles.actionBtnText}>Direction</Text>
            </TouchableOpacity>
          </View>
          <StatusBadge openingHours={center.openingHours} />
        </View>

        {/* Vehicles Served */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Served For</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.vehiclesScrollView}
          contentContainerStyle={styles.vehiclesChipsWrapper}
        >
          {(center.supportedVehicleBrands && center.supportedVehicleBrands.length > 0 
            ? center.supportedVehicleBrands 
            : ['Car', 'Van', 'Bike']).map((v, i) => {
              const type = v.toLowerCase();
              let iconName: any = 'car-outline';
              if(type.includes('bike') || type.includes('motor')) iconName = 'bicycle-outline';
              if(type.includes('van') || type.includes('bus') || type.includes('lorry')) iconName = 'bus-outline';
              
              return (
                <View key={i} style={styles.vehicleChipBadge}>
                  <Ionicons name={iconName} size={14} color="#E84E0F" />
                  <Text style={styles.vehicleChipBadgeText}>
                    {v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()}
                  </Text>
                </View>
              );
          })}
        </ScrollView>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Available Packages</Text>
        </View>

        {center.status !== 'APPROVED' && (
          <View style={{ backgroundColor: '#FFF4ED', padding: 12, marginHorizontal: 20, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#FFDDC2' }}>
            <Text style={{ color: '#E84E0F', fontWeight: 'bold', textAlign: 'center' }}>
              Temporarily Unavailable
            </Text>
            <Text style={{ color: '#C2410C', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              This service center is currently not accepting new bookings.
            </Text>
          </View>
        )}

        {/* Packages List */}
        <View style={{ position: 'relative' }}>
          <View 
            style={styles.packagesList} 
            pointerEvents={center.status !== 'APPROVED' ? 'none' : 'auto'}
          >
            {center.servicePackages && center.servicePackages.length > 0 ? (
              center.servicePackages.map(pkg => <PackageCard key={pkg.packageId || pkg.name} pkg={pkg} centerId={center.centerId} />)
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No packages available for this center.</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </View>

          {center.status !== 'APPROVED' && center.servicePackages && center.servicePackages.length > 0 && (
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PackageCard({ pkg, centerId }: { pkg: ServicePackageDTO; centerId: string }) {
  const router = useRouter();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  const price = typeof pkg.price === 'number' ? pkg.price : Number(pkg.basePrice || pkg.price) || 0;
  const durationInMins = (pkg as any).estimatedDurationMins || 60;
  const durationHours = Math.floor(durationInMins / 60);
  const durationText = durationHours > 0 ? `${durationHours} hrs` : `${durationInMins} mins`;

  const features = useMemo(() => {
    if (pkg.features && pkg.features.length > 0) return pkg.features;
    if (pkg.description) {
      return pkg.description.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    return ['Quality Service Inspection'];
  }, [pkg.features, pkg.description]);

  const packagePlaceholder = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=400&auto=format&fit=crop';

  return (
    <View style={styles.pkgCard}>
      <View style={styles.pkgImageWrapper}>
        <Image 
          source={{ uri: pkg.imageUrl || packagePlaceholder }} 
          style={styles.pkgImage} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.imageGradient}
        />
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>LKR {price.toLocaleString()}</Text>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time" size={12} color="#fff" />
          <Text style={styles.durationBadgeText}>{durationText}</Text>
        </View>
      </View>
      
      <View style={styles.pkgBody}>
        <Text style={styles.pkgName}>{pkg.name}</Text>
        <Text style={styles.pkgSubtitle}>Premium Service Package</Text>

        <View style={styles.featuresList}>
          {features.slice(0, showAllFeatures ? features.length : 3).map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          
          {features.length > 3 && (
            <TouchableOpacity 
              style={styles.moreToggleBtn}
              onPress={() => setShowAllFeatures(!showAllFeatures)}
            >
              <Text style={styles.moreText}>
                {showAllFeatures ? 'Show less' : `+${features.length - 3} more features`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/booking/create', params: { centerId, packageId: pkg.packageId || '', packageName: pkg.name } })}
        >
          <LinearGradient
            colors={['#E84E0F', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Select Package</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </LinearGradient>
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
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
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
  heroContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    color: '#E5E7EB',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionBtn: {
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  closeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  vehiclesScrollView: {
    flexGrow: 0,
    marginBottom: 24,
  },
  vehiclesChipsWrapper: {
    paddingHorizontal: 20,
    paddingRight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4D6',
    gap: 6,
  },
  vehicleChipBadgeText: {
    fontSize: 14,
    color: '#E84E0F',
    fontWeight: '700',
  },
  packagesList: {
    paddingHorizontal: 20,
  },
  pkgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pkgImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  pkgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  priceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceBadgeText: {
    color: '#E84E0F',
    fontSize: 16,
    fontWeight: '900',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  durationBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pkgBody: {
    padding: 20,
  },
  pkgName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  pkgSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  featuresList: {
    marginTop: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  moreToggleBtn: {
    marginTop: 4,
  },
  moreText: {
    fontSize: 14,
    color: '#E84E0F',
    fontWeight: '700',
  },
  bookBtn: {
    marginTop: 24,
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
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
