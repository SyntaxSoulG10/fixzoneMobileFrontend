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
  image: any;
  name: string;
  location: string;
  type: string;
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
        distance: calculatedDistance !== undefined ? calculatedDistance.toFixed(1) : undefined
      },
    });
  };

  const renderVehicleChip = (vType: VehicleType | string, index: number) => {
    return (
      <View key={`${vType}-${index}`} style={styles.vehicleChip}>
        <Text style={styles.vehicleChipText}>
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
          <Text style={styles.compactName}>{name} - {location}</Text>
          {calculatedDistance !== undefined && (
            <Text style={{ fontSize: 12, color: '#E84E0F', fontWeight: 'bold', marginTop: 2 }}>
              {calculatedDistance.toFixed(1)} km away
            </Text>
          )}
          {!hideServedFor && (
            <>
              <Text style={styles.servedForLabel}>Served for :</Text>
              <View style={styles.compactChipRow}>
                {(supportedVehicleBrands.length > 0 ? supportedVehicleBrands : supportedVehicles).map((vType, index) => renderVehicleChip(vType as VehicleType, index))}
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
            {(supportedVehicleBrands.length > 0 ? supportedVehicleBrands : supportedVehicles).map((vType, index, arr) => renderVehicleText(vType as VehicleType, index, index === arr.length - 1))}
          </View>
        </View>

        <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact Styles (Original Home Screen style)
  compactCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  compactInfo: {
    flex: 1,
    marginLeft: 16,
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

  // Premium Styles (High Fidelity)
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  premiumImageContainer: {
    width: '100%',
    height: 160,
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
    height: '70%',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  premiumPriceBadge: {
    position: 'absolute',
    bottom: 68,
    right: 8,
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
    color: '#FFFFFF',
  },
  premiumInfoContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    marginTop: -60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  premiumTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  premiumName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  premiumLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumLocationText: {
    fontSize: 14,
    color: '#E84E0F',
    marginLeft: 6,
    fontWeight: '700',
  },
  premiumVehiclesSection: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  servedForLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  premiumVehicleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailsButton: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
