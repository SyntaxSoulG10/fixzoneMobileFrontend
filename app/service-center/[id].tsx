import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_SERVICE_CENTERS, ServicePackage, VehicleType } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

export default function ServiceCenterDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const center = MOCK_SERVICE_CENTERS.find(c => c.id === id);

  // Initialize selectedVehicleType with the first supported vehicle type
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>(
    center?.supportedVehicles[0] || 'car'
  );

  if (!center) {
    return (
      <View style={styles.container}>
        <Text>Service Center not found</Text>
      </View>
    );
  }

  const filteredPackages = useMemo(() => {
    return center.packages.filter(pkg => pkg.vehicleType === selectedVehicleType);
  }, [center.packages, selectedVehicleType]);

  const handleCall = () => {
    Linking.openURL('tel:0112345678');
  };

  const handleDirection = () => {
    const lat = 6.9271;
    const lng = 79.8612;
    const url = Platform.select({
      ios: `maps:0,0?q=${center.name}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${center.name})`,
    });
    if (url) Linking.openURL(url);
  };

  const handleShare = () => {
    console.log('Sharing center:', center.name);
  };

  const isOpen = () => {
    const now = new Date();
    const [openH, openM] = center.openingTime.split(':').map(Number);
    const [closeH, closeM] = center.closingTime.split(':').map(Number);
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const renderVehicleTab = (type: VehicleType) => {
    const isSelected = selectedVehicleType === type;
    let iconName: keyof typeof Ionicons.glyphMap = 'car-outline';
    if (type === 'bike') iconName = 'bicycle-outline';
    if (type === 'van') iconName = 'bus-outline';
    if (type === 'lorry') iconName = 'car-outline'; // fallback for truck

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

  return (
    <View style={styles.container}>
      {/* Header Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={28} color="#374151" />
        </TouchableOpacity>
        <View style={styles.navTitleContainer}>
          <Text style={styles.navTitle}>{center.name}</Text>
          <Text style={styles.navSubtitle}>Select Service Package</Text>
        </View>
        <TouchableOpacity style={styles.navIcon}>
          <Ionicons name="heart-outline" size={28} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={typeof center.image === 'string' ? { uri: center.image } : center.image} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{center.name}</Text>
            <View style={styles.heroLocationRow}>
              <Ionicons name="location-sharp" size={14} color="#fff" />
              <Text style={styles.heroLocationText}>{center.location} • {center.distance} away</Text>
            </View>
            <View style={styles.heroRatingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.heroRatingText}>{center.rating}({center.ratingCount})</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="call" size={24} color="#E84E0F" />
              </View>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDirection}>
              <View style={styles.actionIconContainerPrimary}>
                <Ionicons name="navigate" size={24} color="#E84E0F" />
              </View>
              <Text style={[styles.actionText, styles.actionTextPrimary]}>Direction</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-social" size={24} color="#E84E0F" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            {isOpen() ? (
              <Text style={styles.statusTextOpen}>🟢 Open • Closes at {center.openUntil}</Text>
            ) : (
              <Text style={styles.statusTextClosed}>🔴 Closed • Opens at {center.openingTime}</Text>
            )}
          </View>
        </View>

        {/* Vehicle Type Selection Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {center.supportedVehicles.map(renderVehicleTab)}
          </ScrollView>
        </View>

        {/* Packages Section */}
        <View style={styles.packagesHeader}>
          <Text style={styles.packagesTitle}>Available Packages</Text>
        </View>

        {filteredPackages.length > 0 ? (
          filteredPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No packages available for this vehicle type.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PackageCard({ pkg }: { pkg: ServicePackage }) {
  return (
    <View style={styles.pkgCard}>
      <View style={styles.pkgImageContainer}>
        <Image source={pkg.image} style={styles.pkgImage} resizeMode="cover" />
        {pkg.isRecommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>RECOMMENDED</Text>
          </View>
        )}
      </View>
      
      <View style={styles.pkgInfo}>
        <View style={styles.pkgTitleRow}>
          <Text style={styles.pkgTitle}>{pkg.name}</Text>
          <View style={styles.pkgPriceCol}>
            <Text style={styles.pkgPrice}>LKR {pkg.price.toLocaleString()}</Text>
            <Text style={styles.pkgPriceSub}>Estimated</Text>
          </View>
        </View>

        <Text style={styles.pkgDuration}>⏱ {pkg.duration}</Text>

        <View style={styles.featuresList}>
          {pkg.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={18} color="#000" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {pkg.features.length > 3 && (
            <Text style={styles.moreFeatures}>+{pkg.features.length - 3} more</Text>
          )}
        </View>

        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  navIcon: {
    padding: 4,
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  navSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  heroName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroLocationText: {
    color: '#fff',
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '600',
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRatingText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    width: width / 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainerPrimary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  actionTextPrimary: {
    color: '#000',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusTextOpen: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 14,
  },
  statusTextClosed: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 14,
  },
  tabsContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabSelected: {
    backgroundColor: '#E84E0F',
    borderColor: '#E84E0F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 8,
  },
  tabTextSelected: {
    color: '#fff',
  },
  packagesHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  packagesTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  pkgCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  pkgImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  pkgImage: {
    width: '100%',
    height: '100%',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  pkgInfo: {
    padding: 16,
  },
  pkgTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pkgTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  pkgPriceCol: {
    alignItems: 'flex-end',
  },
  pkgPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E84E0F',
  },
  pkgPriceSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  pkgDuration: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '800',
    marginLeft: 26,
  },
  bookButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#E84E0F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  }
});
