import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ServicePackageCardProps {
  packageId: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
  vehicleType?: string;
  vehicleBrand?: string;
  type?: string;
  centerId: string;
  centerName: string;
  centerAddress?: string;
  distanceStr?: string;
  isRecommended?: boolean;
  isSelected?: boolean;
  onCardPress?: () => void;
  onSelectPackage: (pkg: {
    packageId: string;
    centerId: string;
    name: string;
    price: number;
  }) => void;
}

export function getServedLabel(vehicleBrand?: string | null, vehicleType?: string | null): string {
  const brand = vehicleBrand?.trim();
  const type = vehicleType?.trim() ? vehicleType.trim().toUpperCase() : '';

  // 1. If brand is "ALL" -> "All [Type] Brands" or "All Brands"
  if (brand && brand.toUpperCase() === 'ALL') {
    return type ? `All ${type} Brands` : 'All Brands';
  }

  // 2. Show brand and type both if brand exists
  if (brand) {
    return type ? `${brand} (${type})` : brand;
  }

  // 3. If no brand -> show type
  if (type) {
    return type;
  }

  return 'All Vehicles';
}

export default function ServicePackageCard({
  packageId,
  name,
  price,
  features = [],
  vehicleType,
  vehicleBrand,
  centerId,
  centerName,
  distanceStr = 'N/A',
  isSelected = false,
  onCardPress,
  onSelectPackage,
}: ServicePackageCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const maxInitialItems = 4;
  const visibleFeatures = isExpanded ? features : features.slice(0, maxInitialItems);
  const hasMoreFeatures = features.length > maxInitialItems;

  const getPackageIcon = (_pkgName: string) => {
    return { icon: 'build-outline' as const, bg: '#FFF7ED', color: '#E84E0F' };
  };

  const iconConfig = getPackageIcon(name);

  const handleCardClick = () => {
    if (onCardPress) {
      onCardPress();
    } else {
      onSelectPackage({ packageId, centerId, name, price });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.packageCard,
        isSelected && styles.packageCardSelected,
      ]}
      onPress={handleCardClick}
      activeOpacity={0.92}
      delayPressIn={60}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        {/* Left: Icon & Name */}
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconBadge, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.icon} size={22} color={iconConfig.color} />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={styles.packageName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.centerRow}>
              <Ionicons name="business-outline" size={13} color="#94A3B8" />
              <Text style={styles.centerName} numberOfLines={1}>
                {centerName}
              </Text>
            </View>
            <View style={styles.servedRow}>
              <Ionicons name="car-outline" size={12} color="#E84E0F" />
              <Text style={styles.servedText}>Served for: {getServedLabel(vehicleBrand, vehicleType)}</Text>
            </View>
          </View>
        </View>

        {/* Right: Price & Distance */}
        <View style={styles.cardHeaderRight}>
          <Text style={styles.packagePrice}>
            LKR {price.toLocaleString()}
          </Text>
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.distanceText}>{distanceStr}</Text>
          </View>
        </View>
      </View>

      {/* Features Checklist */}
      {features && features.length > 0 && (
        <View style={styles.featuresList}>
          {visibleFeatures.map((feat: string, fIndex: number) => (
            <View key={fIndex} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" style={styles.checkIcon} />
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}

          {hasMoreFeatures && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setIsExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.showMoreText}>
                {isExpanded ? 'Show Less' : `Show More (+${features.length - maxInitialItems} items)`}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#E84E0F"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.selectBtn,
          isSelected ? styles.selectBtnPrimary : styles.selectBtnSecondary,
        ]}
        onPress={() => onSelectPackage({ packageId, centerId, name, price })}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.selectBtnText,
            isSelected ? styles.selectBtnTextPrimary : styles.selectBtnTextSecondary,
          ]}
        >
          Select Package
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  packageCardSelected: {
    borderColor: '#E84E0F',
    backgroundColor: '#FFFBF9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 4,
  },
  servedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  servedText: {
    fontSize: 11.5,
    color: '#E84E0F',
    fontWeight: '700',
    marginLeft: 4,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E84E0F',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 2,
  },
  featuresList: {
    marginBottom: 18,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E84E0F',
  },
  selectBtn: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E84E0F',
  },
  selectBtnPrimary: {
    backgroundColor: '#E84E0F',
  },
  selectBtnSecondary: {
    backgroundColor: '#E84E0F',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  selectBtnTextPrimary: {
    color: '#FFFFFF',
  },
  selectBtnTextSecondary: {
    color: '#FFFFFF',
  },
});
