import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform, ActivityIndicator, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';
import StatusBadge from '../../components/ui/StatusBadge';
import { getServedLabel } from '../../components/home/ServicePackageCard';
import * as Clipboard from 'expo-clipboard';
import { openDirections } from '../../utils/location_utils';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export default function ServiceCenterDetails() {
  const { id, distance, from, packageId } = useLocalSearchParams<{ id: string; distance?: string; from?: string; packageId?: string }>();
  const router = useRouter();

  const scrollViewRef = useRef<ScrollView>(null);
  const [packagesSectionY, setPackagesSectionY] = useState(0);
  const hasScrolledRef = useRef(false);

  const handleBack = () => {
    router.replace('/(tabs)/book');
  };

  const [center, setCenter] = useState<ServiceCenterDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const servedList = useMemo(() => {
    if (center?.supportedVehicleBrands && center.supportedVehicleBrands.length > 0) {
      return center.supportedVehicleBrands;
    }
    if (center?.servicePackages && center.servicePackages.length > 0) {
      const derived = Array.from(
        new Set(
          center.servicePackages
            .map((pkg: any) => {
              if (pkg.vehicleBrand && pkg.vehicleBrand.trim() !== '' && pkg.vehicleBrand.toUpperCase() !== 'ALL') {
                return pkg.vehicleBrand.trim();
              }
              if (pkg.vehicleType && pkg.vehicleType.trim() !== '') {
                return pkg.vehicleType.trim().toUpperCase();
              }
              return null;
            })
            .filter(Boolean)
        )
      );
      if (derived.length > 0) return derived;
    }
    return ['Car', 'Van', 'Bike'];
  }, [center]);

  useEffect(() => {
    if (id) {
      loadCenter(id);
    }
  }, [id]);

  const packageCardOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [packageId]);

  const scrollToPackages = (yPos: number) => {
    if (!packageId || hasScrolledRef.current || yPos <= 0 || !scrollViewRef.current) return;
    hasScrolledRef.current = true;
    setTimeout(() => {
      const cardY = packageCardOffsets.current[packageId] || 0;
      const targetY = yPos + cardY - 16;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
    }, 250);
  };

  useEffect(() => {
    if (packageId && packagesSectionY > 0) {
      scrollToPackages(packagesSectionY);
    }
  }, [packageId, packagesSectionY]);

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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef} 
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (packageId && packagesSectionY > 0 && !hasScrolledRef.current) {
            scrollToPackages(packagesSectionY);
          }
        }}
      >
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
          {servedList.map((v: string, i: number) => {
            const type = v.toLowerCase();
            let iconName: any = 'car-outline';
            if (type.includes('bike') || type.includes('motor')) iconName = 'bicycle-outline';
            if (type.includes('van') || type.includes('bus') || type.includes('lorry')) iconName = 'bus-outline';
            
            return (
              <View key={i} style={styles.vehicleChipBadge}>
                <Ionicons name={iconName} size={14} color="#E84E0F" />
                <Text style={styles.vehicleChipBadgeText}>
                  {v}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Section Title */}
        <View 
          style={styles.sectionTitleContainer}
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y;
            setPackagesSectionY(y);
            scrollToPackages(y);
          }}
        >
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
              center.servicePackages.map(pkg => {
                const pkgKey = pkg.packageId || pkg.id;
                return (
                  <PackageCard
                    key={pkgKey || pkg.name}
                    pkg={pkg}
                    centerId={center.centerId}
                    highlightPackageId={packageId}
                    onLayoutY={(y) => {
                      if (pkgKey) {
                        packageCardOffsets.current[pkgKey] = y;
                        if (packageId && (packageId === pkgKey) && packagesSectionY > 0) {
                          scrollToPackages(packagesSectionY);
                        }
                      }
                    }}
                  />
                );
              })
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

function PackageCard({ pkg, centerId, highlightPackageId, onLayoutY }: { pkg: ServicePackageDTO; centerId: string; highlightPackageId?: string; onLayoutY?: (y: number) => void }) {
  const router = useRouter();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const isHighlighted = !!highlightPackageId && (pkg.packageId === highlightPackageId || pkg.id === highlightPackageId);
  
  const price = typeof pkg.price === 'number' ? pkg.price : Number(pkg.basePrice || pkg.price) || 0;
  const durationInMins = (pkg as any).estimatedDurationMins || 60;
  const durationHours = Math.floor(durationInMins / 60);
  const durationText = durationHours > 0 ? `${durationHours} hrs` : `${durationInMins} mins`;

  const features = useMemo(() => {
    if (pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0) return pkg.features;
    if (pkg.type && typeof pkg.type === 'string' && pkg.type.trim().length > 0) {
      if (pkg.type.includes(',') || pkg.type.includes(';')) {
        return pkg.type.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0);
      }
      return [pkg.type.trim()];
    }
    return [];
  }, [pkg.features, pkg.type]);

  const packagePlaceholder = 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=400&auto=format&fit=crop';

  return (
    <View 
      onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}
      style={[styles.pkgCard, isHighlighted && styles.pkgCardHighlighted]}
    >
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
        <View style={styles.servedRow}>
          <Ionicons name="car-outline" size={13} color="#E84E0F" />
          <Text style={styles.servedText}>Served for: {getServedLabel(pkg.vehicleBrand, pkg.vehicleType)}</Text>
        </View>
        {!!pkg.description && (
          <Text style={styles.pkgSubtitle}>{pkg.description}</Text>
        )}

        <View style={styles.featuresList}>
          {features.slice(0, showAllFeatures ? features.length : 3).map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
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
          onPress={() => router.push({ pathname: '/booking/create', params: { centerId, packageId: pkg.packageId || (pkg as any).id || '', packageName: pkg.name } })}
        >
          <LinearGradient
            colors={['#E84E0F', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtn}
          >
            <Text style={styles.bookBtnText}>Select Package</Text>
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
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerIcon: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
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
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  pkgCard: {
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pkgCardHighlighted: {
    borderColor: '#E84E0F',
    borderWidth: 2,
    shadowColor: '#E84E0F',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  pkgImageWrapper: {
    position: 'relative',
    height: 110,
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
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceBadgeText: {
    color: '#E84E0F',
    fontSize: 14,
    fontWeight: '800',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  durationBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pkgBody: {
    padding: 14,
  },
  pkgName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  servedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  servedText: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '700',
    marginLeft: 4,
  },
  pkgSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  featuresList: {
    marginTop: 10,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  moreToggleBtn: {
    marginTop: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '700',
  },
  bookBtn: {
    marginTop: 14,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 14,
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
