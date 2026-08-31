import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import HomeHeader from '../../components/home/HomeHeader';
import SearchBar from '../../components/home/SearchBar';
import ServiceCenterCard from '../../components/home/ServiceCenterCard';
import ServicePackageCard from '../../components/home/ServicePackageCard';
import FilterBottomSheet, { FilterState } from '../../components/home/FilterBottomSheet';
import NoResults from '../../components/home/NoResults';
import { COLORS } from '../../constants/colors';
import { serviceCenterService, ServiceCenterDTO } from '../../services/serviceCenterService';
import * as Location from 'expo-location';
import { calculateDistance } from '../../utils/location_utils';
import { Ionicons } from '@expo/vector-icons';
import { applyFilters, extractFilterOptions } from '../../utils/filter_utils';
import { DisplayPackageItem } from '../service-packages';

export default function BookScreen() {
  const router = useRouter();
  const { focus, search, filter } = useLocalSearchParams<{ focus?: string; search?: string; filter?: string }>();
  const [activeTab, setActiveTab] = useState<'centers' | 'packages'>('centers');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [serviceCenters, setServiceCenters] = useState<ServiceCenterDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    distance: '',
    vehicleType: '',
    price: '',
    availability: '',
  });

  // Package sorting states
  const [sortDistance, setSortDistance] = useState<boolean>(true);
  const [sortPrice, setSortPrice] = useState<boolean>(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sort modal state
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [tempSortDistance, setTempSortDistance] = useState<boolean>(true);
  const [tempSortPrice, setTempSortPrice] = useState<boolean>(false);
  const [tempSortDirection, setTempSortDirection] = useState<'asc' | 'desc'>('asc');

  const searchBarRef = useRef<TextInput>(null);

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterVisible(false);
  };

  const handleResetFilters = () => {
    setFilters({
      distance: '',
      vehicleType: '',
      price: '',
      availability: '',
    });
  };

  useEffect(() => {
    const fetchLocation = async () => {
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
        console.log('Location services unavailable, defaulting center distance to N/A');
      }
    };
    fetchLocation();
    fetchCenters();
  }, []);

  useEffect(() => {
    if (search !== undefined) {
      setSearchQuery(search);
    }
    if (focus === 'true') {
      const timer = setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    if (filter === 'true') {
      setIsFilterVisible(true);
    }
  }, [focus, search, filter]);

  const fetchCenters = async () => {
    try {
      setIsLoading(true);
      const data = await serviceCenterService.getAllServiceCenters();
      setServiceCenters(data.content);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract dynamic filters
  const { availableVehicles, availableServices } = useMemo(() => {
    return extractFilterOptions(serviceCenters);
  }, [serviceCenters]);

  // Apply filters to service centers
  const filteredServiceCenters = useMemo(() => {
    return applyFilters(serviceCenters, filters, searchQuery, userLocation);
  }, [serviceCenters, filters, searchQuery, userLocation]);

  // Extract service packages across all centers
  const allPackages = useMemo(() => {
    const list: DisplayPackageItem[] = [];
    serviceCenters.forEach(center => {
      let distanceKm: number | undefined;
      if (center.latitude && center.longitude && userLocation) {
        distanceKm = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          center.latitude,
          center.longitude
        );
      }

      (center.servicePackages || []).forEach((pkg: any) => {
        let featureList: string[] = [];
        if (pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0) {
          featureList = pkg.features;
        } else if (pkg.type && typeof pkg.type === 'string' && pkg.type.trim().length > 0) {
          if (pkg.type.includes(',') || pkg.type.includes(';')) {
            featureList = pkg.type.split(/[,;]/).map((f: string) => f.trim()).filter((f: string) => f.length > 0);
          } else {
            featureList = [pkg.type.trim()];
          }
        }

        list.push({
          packageId: pkg.packageId || pkg.id,
          name: pkg.name || 'Service Package',
          price: pkg.price || pkg.basePrice || 0,
          description: pkg.description,
          imageUrl: pkg.imageUrl,
          features: featureList,
          vehicleType: pkg.vehicleType,
          type: pkg.serviceType || pkg.type,
          centerId: center.centerId,
          centerName: center.name,
          centerAddress: center.address || '',
          distanceKm,
          distanceStr: distanceKm !== undefined ? `${distanceKm.toFixed(1)} km away` : 'N/A',
          isRecommended: pkg.isRecommended || false,
        });
      });
    });
    return list;
  }, [serviceCenters, userLocation]);

  const filteredPackages = useMemo(() => {
    return allPackages.filter(pkg => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = pkg.name.toLowerCase().includes(q);
        const matchesCenter = pkg.centerName.toLowerCase().includes(q);
        const matchesDesc = pkg.description?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesCenter && !matchesDesc) return false;
      }
      if (filters.distance && pkg.distanceKm !== undefined) {
        const maxDist = parseFloat(filters.distance);
        if (!isNaN(maxDist) && pkg.distanceKm > maxDist) return false;
      }
      if (filters.vehicleType && pkg.vehicleType) {
        if (pkg.vehicleType.toLowerCase() !== filters.vehicleType.toLowerCase()) return false;
      }
      if (filters.serviceType && pkg.type) {
        if (pkg.type.toLowerCase() !== filters.serviceType.toLowerCase()) return false;
      }
      return true;
    });
  }, [allPackages, searchQuery, filters]);

  // Dual Sorting: Distance / Price / Ascending / Descending
  const displayPackages = useMemo(() => {
    let result = [...filteredPackages];

    result.sort((a, b) => {
      let cmp = 0;

      if (sortDistance && sortPrice) {
        const distA = a.distanceKm ?? 999999;
        const distB = b.distanceKm ?? 999999;
        if (distA !== distB) {
          cmp = distA - distB;
        } else {
          cmp = a.price - b.price;
        }
      } else if (sortDistance) {
        const distA = a.distanceKm ?? 999999;
        const distB = b.distanceKm ?? 999999;
        cmp = distA - distB;
      } else if (sortPrice) {
        cmp = a.price - b.price;
      } else {
        const distA = a.distanceKm ?? 999999;
        const distB = b.distanceKm ?? 999999;
        cmp = distA - distB;
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [filteredPackages, sortDistance, sortPrice, sortDirection]);

  // Pagination states (15 results per page)
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Reset page to 0 when filters or sorting change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, filters, sortDistance, sortPrice, sortDirection, activeTab]);

  const totalPages = useMemo(() => {
    return Math.ceil(displayPackages.length / PAGE_SIZE) || 1;
  }, [displayPackages.length]);

  const visiblePackages = useMemo(() => {
    return displayPackages.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  }, [displayPackages, currentPage]);

  const goToPage = (pageIdx: number) => {
    if (pageIdx < 0 || pageIdx >= totalPages) return;
    setCurrentPage(pageIdx);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderServiceCenter = ({ item }: { item: ServiceCenterDTO }) => {
    const priceFrom = item.servicePackages && item.servicePackages.length > 0 
      ? Math.min(...item.servicePackages.map(p => p.price || p.basePrice || 0).filter(p => p > 0)) 
      : 0;

    return (
      <View style={styles.cardWrapper}>
        <ServiceCenterCard 
          id={item.centerId}
          name={item.name}
          location={item.address}
          type="General Service"
          image={item.imageUrl}
          priceFrom={priceFrom}
          openingHours={item.openingHours}
          isVerified={item.isActive}
          supportedVehicleBrands={item.supportedVehicleBrands}
          packages={item.servicePackages}
          variant="premium"
          calculatedDistance={
            item.latitude && item.longitude && userLocation
              ? calculateDistance(
                  userLocation.coords.latitude,
                  userLocation.coords.longitude,
                  item.latitude,
                  item.longitude
                )
              : undefined
          }
        />
      </View>
    );
  };

  const renderServicePackage = ({ item }: { item: DisplayPackageItem }) => {
    return (
      <View style={{ marginBottom: 16 }}>
        <ServicePackageCard
          packageId={item.packageId}
          name={item.name}
          price={item.price}
          description={item.description}
          features={item.features}
          centerId={item.centerId}
          centerName={item.centerName}
          distanceStr={item.distanceStr}
          onSelectPackage={() => {
            router.push({
              pathname: '/service-center/[id]',
              params: {
                id: item.centerId,
                packageId: item.packageId,
              }
            });
          }}
        />
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Fixed Header and Search */}
        <HomeHeader />
        <SearchBar 
          ref={searchBarRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setIsFilterVisible(true)} 
        />

        {/* Dynamic Content List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeTab === 'centers' ? (filteredServiceCenters as any) : (visiblePackages as any)}
            keyExtractor={(item) => activeTab === 'centers' ? item.centerId : `${item.centerId}-${item.packageId}`}
            renderItem={activeTab === 'centers' ? renderServiceCenter : (renderServicePackage as any)}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.sectionHeader}>
                <View style={styles.tabRow}>
                  <TouchableOpacity 
                    style={activeTab === 'centers' ? styles.tabItemActive : styles.tabItemInactive} 
                    onPress={() => setActiveTab('centers')}
                    activeOpacity={0.8}
                  >
                    <Text style={activeTab === 'centers' ? styles.tabTextActive : styles.tabTextInactive}>Service Centers</Text>
                    {activeTab === 'centers' && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={activeTab === 'packages' ? styles.tabItemActive : styles.tabItemInactive} 
                    onPress={() => setActiveTab('packages')}
                    activeOpacity={0.8}
                  >
                    <Text style={activeTab === 'packages' ? styles.tabTextActive : styles.tabTextInactive}>All Packages</Text>
                    {activeTab === 'packages' && <View style={styles.tabIndicator} />}
                  </TouchableOpacity>
                </View>
                
                <View style={styles.subHeaderRow}>
                  <Text style={styles.sectionSubtitle}>
                    {activeTab === 'centers'
                      ? 'Handpicked for Quality assurance'
                      : displayPackages.length === 0
                      ? 'Showing 0 Packages'
                      : `Showing ${currentPage * PAGE_SIZE + 1}-${Math.min((currentPage + 1) * PAGE_SIZE, displayPackages.length)} of ${displayPackages.length} Packages`}
                  </Text>
                  
                  {activeTab === 'packages' && (
                    <TouchableOpacity
                      style={styles.funnelBtn}
                      onPress={() => {
                        setTempSortDistance(sortDistance);
                        setTempSortPrice(sortPrice);
                        setTempSortDirection(sortDirection);
                        setIsSortModalVisible(true);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="funnel-outline" size={14} color="#E84E0F" />
                      <Text style={styles.funnelBtnText}>Sort & Filter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            }
            ListEmptyComponent={
              <NoResults 
                query={searchQuery || 'selected filters'} 
                onReset={() => {
                  setSearchQuery('');
                  handleResetFilters();
                }} 
              />
            }
            ListFooterComponent={
              activeTab === 'packages' && displayPackages.length > 0 ? (
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
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Global Filter Bottom Sheet */}
        <FilterBottomSheet
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          initialFilters={filters}
          availableVehicles={availableVehicles}
          availableServices={availableServices}
        />

        {/* Funnel Sort & Filter Centered Popup Overlay for All Packages */}
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
                    activeOpacity={0.8}
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
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalApplyBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    marginBottom: 14,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  tabItemActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 8,
  },
  tabTextActive: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#E84E0F',
    borderRadius: 2,
  },
  tabItemInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  tabTextInactive: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1,
  },
  funnelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  funnelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E84E0F',
    marginLeft: 4,
  },
  cardWrapper: {
    marginBottom: 0,
  },

  // Modal Styles
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
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalResetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E84E0F',
    alignItems: 'center',
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Pagination Styles
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
