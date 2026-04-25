import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VehicleType } from '../../constants/mock_data';

const { width } = Dimensions.get('window');

interface ServiceCenterCardProps {
  id: string;
  image: any;
  name: string;
  location: string;
  type: string;
  distance: string;
  rating?: number;
  ratingCount?: number;
  priceFrom?: number;
  openUntil?: string;
  isVerified?: boolean;
  supportedVehicles?: VehicleType[];
  variant?: 'compact' | 'premium';
}

export default function ServiceCenterCard({
  id,
  image,
  name,
  location,
  type,
  distance,
  rating = 0,
  ratingCount = 0,
  priceFrom = 0,
  openUntil = '',
  isVerified = false,
  supportedVehicles = [],
  variant = 'compact',
}: ServiceCenterCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: '/service-center/[id]',
      params: { id, name },
    });
  };

  const renderVehicleChip = (vType: VehicleType) => {
    return (
      <View key={vType} style={styles.vehicleChip}>
        <Text style={styles.vehicleChipText}>
          {vType.charAt(0).toUpperCase() + vType.slice(1)}
        </Text>
      </View>
    );
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={styles.compactCard}
      >
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          style={styles.compactImage}
        />
        <View style={styles.compactInfo}>
          <Text style={styles.compactName}>{name} - {location}</Text>
          <Text style={styles.compactSubtitle}>{distance} away</Text>
          <Text style={styles.servedForLabel}>Served for :</Text>
          <View style={styles.compactChipRow}>
            {supportedVehicles.map(renderVehicleChip)}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Premium Variant (High-Fidelity)
  return (
    <TouchableOpacity
      style={styles.premiumCard}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.premiumImageContainer}>
        <Image
          source={typeof image === 'string' ? { uri: image } : image}
          style={styles.premiumImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.premiumInfoContainer}>
        <Text style={styles.premiumName}>{name}</Text>

        <View style={styles.premiumLocationRow}>
          <Ionicons name="location-sharp" size={14} color="#6B7280" />
          <Text style={styles.premiumLocationText}>{location}    {distance} away</Text>
        </View>

        <Text style={styles.premiumStatusText}>Open until {openUntil}</Text>

        <View style={styles.premiumBottomRow}>
          <View style={styles.premiumVehiclesAndPrice}>
            <Text style={styles.servedForLabel}>Served for :</Text>
            <View style={styles.premiumVehicleChips}>
              {supportedVehicles.map(renderVehicleChip)}
            </View>
            <Text style={styles.premiumPriceLabel}>STARTING FROM</Text>
            <Text style={styles.premiumPriceValue}>LKR {priceFrom.toLocaleString()}</Text>
          </View>

          <View style={styles.premiumRatingAndAction}>
            <View style={styles.premiumRatingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.premiumRatingText}>{rating}({ratingCount})</Text>
            </View>
            <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  premiumImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  premiumImage: {
    width: '100%',
    height: '100%',
  },
  premiumInfoContainer: {
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  premiumName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  premiumLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  premiumLocationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  premiumStatusText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 12,
  },
  premiumBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  premiumVehiclesAndPrice: {
    flex: 1,
  },
  servedForLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 4,
  },
  vehicleChip: {
    backgroundColor: '#FFF7ED',
    borderWidth: 0.5,
    borderColor: '#E84E0F',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  vehicleChipText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },
  compactChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  premiumVehicleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  premiumPriceLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
  },
  premiumPriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#E84E0F',
  },
  premiumRatingAndAction: {
    alignItems: 'flex-end',
  },
  premiumRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
  },
  detailsButton: {
    backgroundColor: '#E84E0F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
