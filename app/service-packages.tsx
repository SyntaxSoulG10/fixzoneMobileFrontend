import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { serviceCenterService, ServiceCenterDTO } from '../services/serviceCenterService';
import { calculateDistance } from '../utils/location_utils';
import { COLORS } from '../constants/colors';
import FilterBottomSheet, { FilterState } from '../components/home/FilterBottomSheet';
import ServicePackageCard from '../components/home/ServicePackageCard';
import { extractFilterOptions } from '../utils/filter_utils';

export interface DisplayPackageItem {
  packageId: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  features: string[];
  vehicleType?: string;
  type?: string;
  centerId: string;
  centerName: string;
  centerAddress: string;
  distanceKm?: number;
  distanceStr: string;
  isRecommended?: boolean;
}

export default function ServicePackagesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [centers, setCenters] = useState<ServiceCenterDTO[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  // Sorting states
  const [sortDistance, setSortDistance] = useState<boolean>(true);
  const [sortPrice, setSortPrice] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort modal state
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [tempSortDistance, setTempSortDistance] = useState<boolean>(true);
  const [tempSortPrice, setTempSortPrice] = useState<boolean>(false);
  const [tempSortDirection, setTempSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination states (15 results per page)
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Filter bottom sheet state
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    price: '',
    availability: '',
  });

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  const loadPageData = async (pageNum: number, isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      // Fetch user location on initial load
      if (isInitial && !userLocation) {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let location = await Location.getLastKnownPositionAsync({});
            if (!location) {
              location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
            }
            if (location) setUserLocation(location);
          }
        } catch (e) {
          console.log('Location services unavailable, defaulting to N/A');
        }
      }

      // Fetch paginated service centers from backend
      const res = await serviceCenterService.getAllServiceCenters(pageNum, PAGE_SIZE);
      const newCenters = res.content || [];

      if (isInitial) {
        setCenters(newCenters);
      } else {
        // Append new page items avoiding duplicates
        setCenters(prev => {
          const existingIds = new Set(prev.map(c => c.centerId));
          const filtered = newCenters.filter(c => !existingIds.has(c.centerId));
          return [...prev, ...filtered];
        });
      }

      // Determine if more pages exist
      setHasMore(!res.last && newCenters.length > 0);
    } catch (err) {
      console.error('Failed to load packages data:', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadPageData(0, true);
  }, []);

  // Sync temp sort state when opening modal
  useEffect(() => {
    if (isSortModalVisible) {
      setTempSortDistance(sortDistance);
      setTempSortPrice(sortPrice);
      setTempSortDirection(sortDirection);
    }
  }, [isSortModalVisible, sortDistance, sortPrice, sortDirection]);

  // Extract filter options
  const { availableVehicles, availableServices } = useMemo(() => {
    return extractFilterOptions(centers);
  }, [centers]);

  // Flatten and process packages
  const displayPackages = useMemo(() => {
    let items: DisplayPackageItem[] = [];

    centers.forEach(center => {
      // Check active center filter
      if (filters.availability === 'Open Now' && center.isActive === false) return;
      if (filters.availability === '24/7' && (!center.openingHours || !center.openingHours.includes('24'))) return;

      // Check vehicle brand filter
      if (filters.vehicleType && center.supportedVehicleBrands && center.supportedVehicleBrands.length > 0) {
        const targetVt = filters.vehicleType.toLowerCase();
        const matchesBrand = center.supportedVehicleBrands.some(b => b.toLowerCase().includes(targetVt));
        if (!matchesBrand) return;
      }

      // Calculate distance if available
      let distKm: number | undefined = undefined;
      let distStr = 'N/A';
      if (userLocation && center.latitude && center.longitude) {
        distKm = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          center.latitude,
          center.longitude
        );
        distStr = `${distKm.toFixed(1)} km away`;
      }

      // Distance filter check
      if (filters.distance && distKm !== undefined) {
        const maxKm = filters.distance.includes('Nearby') ? 5 : parseInt(filters.distance.replace('km', ''));
        if (!isNaN(maxKm) && distKm > maxKm) return;
      }

      if (center.servicePackages && center.servicePackages.length > 0) {
        center.servicePackages.forEach((pkg, index) => {
          // Parse features array strictly from type column or features array
          let featList: string[] = [];
          if (pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0) {
            featList = pkg.features;
          } else if (pkg.type && typeof pkg.type === 'string' && pkg.type.trim().length > 0) {
            if (pkg.type.includes(',') || pkg.type.includes(';')) {
              featList = pkg.type
                .split(/[,;]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
            } else {
              featList = [pkg.type.trim()];
            }
          }

          items.push({
            packageId: pkg.packageId || pkg.id || `pkg-${center.centerId}-${index}`,
            name: pkg.name || 'Service Package',
            price: pkg.price || pkg.basePrice || 0,
            description: pkg.description,
            imageUrl: pkg.imageUrl,
            features: featList,
            vehicleType: pkg.vehicleType,
            type: pkg.type,
            centerId: center.centerId,
            centerName: center.name,
            centerAddress: center.address,
            distanceKm: distKm,
            distanceStr: distStr,
            isRecommended: !!pkg.isRecommended,
          });
        });
      }
    });

    // Apply Sorting
    return items.sort((a, b) => {
      if (filters.price === 'Low to High') {
        return a.price - b.price;
      }
      if (filters.price === 'High to Low') {
        return b.price - a.price;
      }

      const isAsc = sortDirection === 'asc';
      if (sortDistance && sortPrice) {
        const dA = a.distanceKm ?? 9999;
        const dB = b.distanceKm ?? 9999;
        const distDiff = isAsc ? dA - dB : dB - dA;
        if (distDiff !== 0) return distDiff;
        return isAsc ? a.price - b.price : b.price - a.price;
      }
      if (sortDistance) {
        const dA = a.distanceKm ?? 9999;
        const dB = b.distanceKm ?? 9999;
        return isAsc ? dA - dB : dB - dA;
      }
      if (sortPrice) {
        return isAsc ? a.price - b.price : b.price - a.price;
      }
      return 0;
    });
  }, [centers, userLocation, filters, sortDistance, sortPrice, sortDirection]);

  // Total pages calculation
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(displayPackages.length / PAGE_SIZE));
  }, [displayPackages.length, PAGE_SIZE]);

  // Paginated visible items for current page
  const visiblePackages = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    return displayPackages.slice(startIndex, startIndex + PAGE_SIZE);
  }, [displayPackages, currentPage, PAGE_SIZE]);

  // Navigate to specific page number
  const goToPage = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages) return;
    setCurrentPage(pageIndex);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    // Fetch next backend page if user approaches end of cached centers
    if ((pageIndex + 1) * PAGE_SIZE > centers.length && hasMore && !isFetchingMore) {
      const nextBackendPage = Math.floor(centers.length / PAGE_SIZE) + 1;
      loadPageData(nextBackendPage, false);
    }
  };

  const handleSelectPackage = (pkgItem: DisplayPackageItem) => {
    setSelectedPackageId(pkgItem.packageId);
    router.push({
      pathname: '/service-center/[id]',
      params: {
        id: pkgItem.centerId,
        name: pkgItem.centerName,
        packageId: pkgItem.packageId,
        from: 'service-packages',
      },
    });
  };

  const getPackageIcon = (_name: string) => {
    return { icon: 'build-outline' as const, bg: '#FFF7ED', color: '#E84E0F' };
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerSide}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Packages</Text>
        <View style={styles.headerSideRight} />
      </View>

      {/* Sub-Header with Item Count & Funnel Filter Button on Right Corner */}
      <View style={styles.subHeader}>
        <Text style={styles.subHeaderCount}>
          Showing {visiblePackages.length} of {displayPackages.length} Packages
        </Text>
        <TouchableOpacity
          style={styles.funnelBtn}
          onPress={() => setIsSortModalVisible(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="funnel-outline" size={16} color="#E84E0F" />
          <Text style={styles.funnelBtnText}>Sort & Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Package List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Packages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={visiblePackages}
          keyExtractor={(item) => item.packageId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Packages Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search query.</Text>
            </View>
          }
          ListFooterComponent={
            displayPackages.length > 0 ? (
              <View style={styles.paginationContainer}>
                {/* Previous Button */}
                <TouchableOpacity
                  style={[
                    styles.pageNavBtn,
                    currentPage === 0 && styles.pageNavBtnDisabled,
                  ]}
                  onPress={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentPage === 0 ? '#94A3B8' : '#E84E0F'}
                  />
                  <Text
                    style={[
                      styles.pageNavBtnText,
                      currentPage === 0 && styles.pageNavBtnTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>

                {/* Page Number Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pageNumbersRow}
                >
                  {Array.from({ length: totalPages }, (_, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.pageNumberChip,
                        currentPage === idx && styles.pageNumberChipActive,
                      ]}
                      onPress={() => goToPage(idx)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pageNumberText,
                          currentPage === idx && styles.pageNumberTextActive,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.pageNavBtn,
                    currentPage >= totalPages - 1 && styles.pageNavBtnDisabled,
                  ]}
                  onPress={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.pageNavBtnText,
                      currentPage >= totalPages - 1 && styles.pageNavBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentPage >= totalPages - 1 ? '#94A3B8' : '#E84E0F'}
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ServicePackageCard
              packageId={item.packageId}
              name={item.name}
              price={item.price}
              description={item.description}
              features={item.features}
              vehicleType={item.vehicleType}
              vehicleBrand={item.vehicleBrand}
              type={item.type}
              centerId={item.centerId}
              centerName={item.centerName}
              centerAddress={item.centerAddress}
              distanceStr={item.distanceStr}
              isRecommended={item.isRecommended}
              isSelected={selectedPackageId === item.packageId}
              onCardPress={() => setSelectedPackageId(item.packageId)}
              onSelectPackage={(pkg) => handleSelectPackage({ ...item, ...pkg })}
            />
          )}
        />
      )}

      {/* Funnel Sort & Filter Centered Popup Overlay */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsSortModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Ionicons name="funnel-outline" size={20} color="#E84E0F" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Sort & Filter Options</Text>
                </View>
                <TouchableOpacity onPress={() => setIsSortModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Sort By Section */}
                <Text style={styles.sectionHeaderLabel}>Sort By</Text>

                {/* Distance */}
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => {
                    if (tempSortDistance && !tempSortPrice) return;
                    setTempSortDistance(!tempSortDistance);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tempSortDistance ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={tempSortDistance ? '#E84E0F' : '#94A3B8'}
                  />
                  <Text style={[styles.checkboxLabel, tempSortDistance && styles.checkboxLabelActive]}>
                    Distance
                  </Text>
                </TouchableOpacity>

                {/* Price */}
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => {
                    if (tempSortPrice && !tempSortDistance) return;
                    setTempSortPrice(!tempSortPrice);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tempSortPrice ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={tempSortPrice ? '#E84E0F' : '#94A3B8'}
                  />
                  <Text style={[styles.checkboxLabel, tempSortPrice && styles.checkboxLabelActive]}>
                    Price
                  </Text>
                </TouchableOpacity>

                {/* Ascending */}
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => setTempSortDirection('asc')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tempSortDirection === 'asc' ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={tempSortDirection === 'asc' ? '#E84E0F' : '#94A3B8'}
                  />
                  <Text style={[styles.checkboxLabel, tempSortDirection === 'asc' && styles.checkboxLabelActive]}>
                    Ascending
                  </Text>
                </TouchableOpacity>

                {/* Descending */}
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() => setTempSortDirection('desc')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tempSortDirection === 'desc' ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={tempSortDirection === 'desc' ? '#E84E0F' : '#94A3B8'}
                  />
                  <Text style={[styles.checkboxLabel, tempSortDirection === 'desc' && styles.checkboxLabelActive]}>
                    Descending
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Modal Footer Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalResetBtn}
                  onPress={() => {
                    setTempSortDistance(true);
                    setTempSortPrice(false);
                    setTempSortDirection('asc');
                  }}
                >
                  <Text style={styles.modalResetBtnText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalApplyBtn}
                  onPress={() => {
                    setSortDistance(tempSortDistance);
                    setSortPrice(tempSortPrice);
                    setSortDirection(tempSortDirection);
                    setIsSortModalVisible(false);
                  }}
                >
                  <Text style={styles.modalApplyBtnText}>Apply Sorting</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setIsFilterVisible(false);
        }}
        onReset={() => {
          setFilters({
            distance: '',
            vehicleType: '',
            price: '',
            availability: '',
          });
        }}
        initialFilters={filters}
        availableVehicles={availableVehicles}
        availableServices={availableServices}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSideRight: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginTop: -2,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  subHeaderCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  funnelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  funnelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E84E0F',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  selectBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnPrimary: {
    backgroundColor: '#E84E0F',
  },
  selectBtnSecondary: {
    backgroundColor: '#F1F5F9',
  },
  selectBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectBtnTextPrimary: {
    color: '#FFFFFF',
  },
  selectBtnTextSecondary: {
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionHeaderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 12,
  },
  checkboxLabelActive: {
    color: '#E84E0F',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalResetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E84E0F',
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 8,
    marginBottom: 20,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pageNavBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E84E0F',
    marginHorizontal: 2,
  },
  pageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
  },
  pageNumberChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberChipActive: {
    backgroundColor: '#E84E0F',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },
});
