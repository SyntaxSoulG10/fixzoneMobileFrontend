import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform, ActivityIndicator, SafeAreaView, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { serviceCenterService, ServiceCenterDTO, ServicePackageDTO } from '../../services/serviceCenterService';
import StatusBadge from '../../components/ui/StatusBadge';

const { width } = Dimensions.get('window');

type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export default function ServiceCenterDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
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
            <Text style={styles.heroSubtitle}>{center.address || 'Colombo 07'}  |  2.4 km away</Text>
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
            <TouchableOpacity style={styles.actionBtn}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="navigate" size={18} color="#111827" />
              </View>
              <Text style={styles.actionBtnText}>Direction</Text>
            </TouchableOpacity>
          </View>
          <StatusBadge openingHours={center.openingHours} />
        </View>

        {/* Section Title */}
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Available Packages</Text>
        </View>

        {/* Packages List */}
        <View style={styles.packagesList}>
          {center.servicePackages && center.servicePackages.length > 0 ? (
            center.servicePackages.map(pkg => <PackageCard key={pkg.packageId || pkg.name} pkg={pkg} centerId={center.centerId} />)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No packages available for this center.</Text>
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
      <Image 
        source={{ uri: pkg.imageUrl || packagePlaceholder }} 
        style={styles.pkgImage} 
      />
      
      <View style={styles.pkgBody}>
        <View style={styles.pkgHeaderRow}>
          <Text style={styles.pkgName}>{pkg.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.pkgPrice}>LKR {price.toLocaleString()}</Text>
            <Text style={styles.estimatedText}>Estimated</Text>
          </View>
        </View>

        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={16} color="#4B5563" />
          <Text style={styles.durationText}>{durationText}</Text>
        </View>

        <View style={styles.featuresList}>
          {features.slice(0, showAllFeatures ? features.length : 3).map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
          {!showAllFeatures && features.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllFeatures(true)}>
              <Text style={styles.moreText}>+{features.length - 3} more</Text>
            </TouchableOpacity>
          )}
          {showAllFeatures && features.length > 3 && (
            <TouchableOpacity onPress={() => setShowAllFeatures(false)}>
              <Text style={styles.moreText}>Show less</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/booking/create', params: { centerId, packageId: pkg.packageId || '', packageName: pkg.name } })}
        >
          <Text style={styles.bookBtnText}>Select Package</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
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
    height: 130,
    backgroundColor: '#E5E7EB',
  },
  pkgBody: {
    padding: 16,
  },
  pkgHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pkgName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  pkgPrice: {
    fontSize: 16,
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
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  featuresList: {
    marginTop: 12,
    gap: 8,
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
    fontSize: 13,
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
    marginTop: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#111827',
    fontSize: 15,
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
