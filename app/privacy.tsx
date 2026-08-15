import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();
  const adminEmail = 'admin1@fixzone.lk';

  const handleSendEmail = () => {
    const mailUrl = `mailto:${adminEmail}?subject=Privacy%20Concern%20/%20Issue`;
    Linking.openURL(mailUrl).catch(() => {
      Alert.alert(
        'Admin Contact',
        `Could not open email client automatically.\n\nPlease send your concern email directly to:\n${adminEmail}`
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Effective Date Badge */}
        <View style={styles.dateBadge}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#E84E0F" />
          <Text style={styles.dateText}>Last updated: August 2026</Text>
        </View>

        <Text style={styles.introText}>
          FixZone values your trust and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.
        </Text>

        {/* Policy Section 1 */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#E84E0F" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          </View>
          <Text style={styles.policyText}>
            We collect personal information necessary to deliver vehicle maintenance services, including your name, email address, phone number, registered vehicle details (brand, model, license plate), and location data when searching for nearby service centers.
          </Text>
        </View>

        {/* Policy Section 2 */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cog-outline" size={20} color="#E84E0F" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          </View>
          <Text style={styles.policyText}>
            Your information is used strictly to create and manage service bookings, send automated status notifications (Service Started, Completed), facilitate online initial payments via Stripe, and assist service managers in fulfilling your service requests.
          </Text>
        </View>

        {/* Policy Section 3 */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#E84E0F" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>3. Payment Security & Processing</Text>
          </View>
          <Text style={styles.policyText}>
            All online booking fee payments are securely processed through Stripe Connect. FixZone does not store or process your full credit or debit card credentials on our servers.
          </Text>
        </View>

        {/* Policy Section 4 */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed-outline" size={20} color="#E84E0F" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>4. Data Protection & Storage</Text>
          </View>
          <Text style={styles.policyText}>
            We employ encrypted communication protocols (HTTPS/SSL) and secure authentication measures to protect your account data against unauthorized access, alteration, or disclosure.
          </Text>
        </View>

        {/* Policy Section 5 */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#E84E0F" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>5. Your Rights & Data Control</Text>
          </View>
          <Text style={styles.policyText}>
            You have the right to view, update, or remove your personal information and registered vehicles at any time directly through the app settings or by contacting our administration team.
          </Text>
        </View>

        {/* Admin Concern Card */}
        <View style={styles.concernCard}>
          <View style={styles.concernHeader}>
            <View style={styles.concernIconCircle}>
              <Ionicons name="help-buoy-outline" size={24} color="#E84E0F" />
            </View>
            <View style={styles.concernHeaderText}>
              <Text style={styles.concernTitle}>Have a Privacy Concern or Issue?</Text>
              <Text style={styles.concernSubtitle}>
                If you have any questions, data inquiries, or privacy concerns, please contact our System Admin team.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.emailBtn}
            onPress={handleSendEmail}
            activeOpacity={0.8}
          >
            <Text style={styles.emailBtnText}>Click here to send concern email to admin</Text>
          </TouchableOpacity>

          <Text style={styles.responseTimeText}>
            • Response may take up to 5 business days.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E84E0F',
  },
  introText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  policyCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    fontWeight: '500',
  },
  concernCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  concernHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  concernIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  concernHeaderText: {
    flex: 1,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  concernSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  responseTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
  },
  emailBtn: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E84E0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  emailBtnText: {
    color: '#E84E0F',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
