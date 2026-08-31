import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { centerName, vehicleName, date, time, price } = useLocalSearchParams<{
    centerName: string;
    vehicleName: string;
    date: string;
    time: string;
    price: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Booking Successful!</Text>
        <Text style={styles.subtitle}>Your appointment has been confirmed.</Text>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="business" size={20} color="#F97316" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Service Center</Text>
              <Text style={styles.detailValue}>{centerName || 'Auto Expert Service'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="car" size={20} color="#F97316" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{vehicleName || 'Honda Vezel'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.halfDetail}>
              <View style={styles.detailIcon}>
                <Ionicons name="calendar" size={20} color="#F97316" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{date || 'Oct 26, 2026'}</Text>
              </View>
            </View>
            <View style={styles.halfDetail}>
              <View style={styles.detailIcon}>
                <Ionicons name="time" size={20} color="#F97316" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{time || '10:00 AM'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>Total Price</Text>
            <Text style={styles.totalValue}>LKR {price || '15,000'}</Text>
          </View>
        </View>

      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/history')}
        >
          <Text style={styles.primaryButtonText}>View My Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingTop: 80,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 20,
    color: '#F97316',
    fontWeight: '900',
  },
  footerNote: {
    marginTop: 30,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#F97316',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
  },
});
