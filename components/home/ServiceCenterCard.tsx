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

  const renderVehicleIcon = (vType: VehicleType) => {
    let iconName: keyof typeof Ionicons.glyphMap = 'car-outline';
    if (vType === 'bike') iconName = 'bicycle-outline';
    if (vType === 'van') iconName = 'bus-outline';
    if (vType === 'lorry') iconName = 'car-outline';

    return <Ionicons key={vType} name={iconName} size={16} color="black" style={{ marginRight: 8 }} />;
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
          <Text style={styles.compactSubtitle}>{type} - {distance}</Text>
          <Text style={styles.compactLabel}>Served for :</Text>
          <View style={styles.compactIcons}>
            <Ionicons name="bicycle-outline" size={16} color="#f97316" style={{ marginRight: 12 }} />
            <Ionicons name="car-outline" size={16} color="#f97316" style={{ marginRight: 12 }} />
            <Ionicons name="bus-outline" size={16} color="#f97316" />
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
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.verifiedText}>FIXZONE VERIFIED</Text>
          </View>
        )}
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
            <View style={styles.premiumVehicleIcons}>
              {supportedVehicles.map(renderVehicleIcon)}
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
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E84E0F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
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
  premiumVehicleIcons: {
    flexDirection: 'row',
    marginBottom: 8,
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
