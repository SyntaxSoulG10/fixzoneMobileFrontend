import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import AppButton from '../ui/AppButton';

const { height } = Dimensions.get('window');

const DISTANCE_OPTIONS = ['Nearby', '2km', '5km', '10km'];
const VEHICLE_TYPES = ['Car', 'Bike', 'Van', 'Lorry'];
const SERVICE_TYPES = [
  'General Service',
  'Engine Repair',
  'Electrical',
  'Tire Service',
  'Emergency Service',
];
const AVAILABILITY_OPTIONS = ['Open Now', '24/7', 'Available Today'];

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  initialFilters: FilterState;
}

export interface FilterState {
  distance: string;
  vehicleType: string;
  serviceType: string;
  availability: string;
}

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  onReset,
  initialFilters,
}: FilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleSelect = (category: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category] === value ? '' : value,
    }));
  };

  const renderChip = (category: keyof FilterState, value: string) => {
    const isSelected = filters[category] === value;
    return (
      <TouchableOpacity
        key={value}
        onPress={() => handleSelect(category, value)}
        style={[
          styles.chip,
          isSelected ? styles.chipSelected : styles.chipUnselected,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.container}>
          <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <View style={styles.headerRow}>
                <Text style={styles.title}>Filter</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Distance Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Distance</Text>
                <View style={styles.chipGroup}>
                  {DISTANCE_OPTIONS.map((option) => renderChip('distance', option))}
                </View>
              </View>

              {/* Vehicle Type Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle Type</Text>
                <View style={styles.chipGroup}>
                  {VEHICLE_TYPES.map((option) => renderChip('vehicleType', option))}
                </View>
              </View>

              {/* Service Type Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service Type</Text>
                <View style={styles.chipGroup}>
                  {SERVICE_TYPES.map((option) => renderChip('serviceType', option))}
                </View>
              </View>

              {/* Availability Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Availability</Text>
                <View style={styles.chipGroup}>
                  {AVAILABILITY_OPTIONS.map((option) => renderChip('availability', option))}
                </View>
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer Buttons */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={() => {
                  onReset();
                  setFilters({
                    distance: '',
                    vehicleType: '',
                    serviceType: '',
                    availability: '',
                  });
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <AppButton
                label="Apply"
                onPress={() => onApply(filters)}
                style={styles.applyButton}
              />
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    maxHeight: height * 0.87,
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextUnselected: {
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 2,
  },
});
