import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VehicleType } from '../../constants/mock_data';
import { isServiceCenterOpen } from '../../utils/businessHours';

const { width } = Dimensions.get('window');

interface ServiceCenterCardProps {
  id: string;
  image?: any;
  name: string;
  location?: string;
  type?: string;
  priceFrom?: number;
  openingHours?: string;
  isVerified?: boolean;
  supportedVehicles?: VehicleType[];
  supportedVehicleBrands?: string[];
  variant?: 'compact' | 'premium';
  calculatedDistance?: number;
  hideServedFor?: boolean;
}

export default function ServiceCenterCard({
  id,
  image,
  name,
  location,
  type,
  priceFrom = 0,
  openingHours = '',
  isVerified = false,
  supportedVehicles = [],
  supportedVehicleBrands = [],
  variant = 'compact',
  calculatedDistance,
  hideServedFor = false,
}: ServiceCenterCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/service-center/[id]',
      params: {
        id,
        name,
        distance: calculatedDistance !== undefined ? calculatedDistance.toFixed(1) : undefined,
        from: 'book'
      },
    });
  };

  const renderVehicleChip = (vType: VehicleType | string, index: number) => {
    return (
      <View key={`${vType}-${index}`} style={styles.vehicleChip}>
        <View style={styles.bulletPoint} />
        <Text style={styles.vehicleChipText} numberOfLines={1}>
          {vType.charAt(0).toUpperCase() + vType.slice(1).toLowerCase()}
        </Text>
      </View>
    );
  };

  const renderVehicleText = (vType: VehicleType | string, index: number, isLast: boolean) => {
    return (
      <Text key={`${vType}-${index}`} style={styles.vehicleChipText}>
        {vType.charAt(0).toUpperCase() + vType.slice(1).toLowerCase()}{!isLast && ', '}
      </Text>
    );
  };

  const defaultImage = { uri: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=400&auto=format&fit=crop' };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.compactCard}
      >
        <Image
          source={image ? (typeof image === 'string' ? { uri: image } : image) : defaultImage}
          style={styles.compactImage}
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{name}</Text>
          {calculatedDistance !== undefined && (
            <Text style={{ fontSize: 12, color: '#E84E0F', fontWeight: 'bold', marginTop: 2 }}>
              {calculatedDistance.toFixed(1)} km away
            </Text>
          )}
          {!hideServedFor && (
            <>
              <Text style={styles.servedForLabel}>Served for :</Text>
              <View style={styles.compactChipRow}>
                {((supportedVehicleBrands && supportedVehicleBrands.length > 0) ? supportedVehicleBrands : (supportedVehicles || [])).map((vType, index) => renderVehicleChip(vType as VehicleType, index))}
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const isOpen = isServiceCenterOpen(openingHours);

  // Premium Variant (High-Fidelity)
  return (
    <TouchableOpacity
      style={styles.premiumCard}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      <View style={styles.premiumImageContainer}>
        <Image
          source={image ? (typeof image === 'string' ? { uri: image } : image) : defaultImage}
          style={styles.premiumImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.premiumImageGradient}
        />
        {isOpen !== null && (
          <View style={[styles.statusBadgeOverlay, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]}>
            <Text style={styles.statusBadgeText}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
          </View>
        )}
        <View style={styles.premiumPriceBadge}>
          <Text style={styles.premiumPriceLabel}>Starting from</Text>
          <Text style={styles.premiumPriceValue}>LKR {priceFrom > 0 ? priceFrom.toLocaleString() : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.premiumInfoContainer}>
        <View style={styles.premiumTitleRow}>
          <Text style={styles.premiumName} numberOfLines={1}>{name}</Text>
        </View>

        {calculatedDistance !== undefined && (
          <View style={styles.premiumLocationRow}>
            <Ionicons name="navigate-outline" size={14} color="#E84E0F" />
            <Text style={styles.premiumLocationText}>
              {calculatedDistance.toFixed(1)} km away
            </Text>
          </View>
        )}

        <View style={styles.premiumVehiclesSection}>
          <Text style={styles.servedForLabel}>Served for:</Text>
          <View style={styles.premiumVehicleChips}>
            {((supportedVehicleBrands && supportedVehicleBrands.length > 0) ? supportedVehicleBrands : (supportedVehicles || [])).map((vType, index, arr) => renderVehicleText(vType as VehicleType, index, index === arr.length - 1))}
          </View>
        </View>

        <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact Styles (Original Home Screen style)
  compactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 14,
  },
  compactName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  compactSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  compactLabel: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },
  compactIcons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  servedForLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  compactChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleChip: {
    width: '48%', // two-column layout
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E84E0F',
    marginRight: 6,
  },
  vehicleChipText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '500',
  },

  // Premium Styles (High Fidelity)
  premiumCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  premiumImageContainer: {
    width: '100%',
    height: 162,
    position: 'relative',
  },
  premiumImage: {
    width: '100%',
    height: '100%',
  },
  premiumImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  premiumPriceBadge: {
    position: 'absolute',
    bottom: 46, // Adjusted for the new marginTop of info container
    right: 10,
    alignItems: 'flex-end',
  },
  premiumPriceLabel: {
    fontSize: 12,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  premiumPriceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  premiumInfoContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 10,
    backgroundColor: '#F8FAFC',
    marginTop: -38, // Shows more image
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  premiumTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  premiumName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  premiumLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  premiumLocationText: {
    fontSize: 13,
    color: '#E84E0F',
    marginLeft: 4,
    fontWeight: '700',
  },
  premiumVehiclesSection: {
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  premiumVehicleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailsButton: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
