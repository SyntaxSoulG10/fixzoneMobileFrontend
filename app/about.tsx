import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Brand Banner Card */}
        <View style={styles.brandCard}>
          <Image 
            source={require('../assets/images/fixzone-logo.png')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.appName}>FixZone</Text>
          <Text style={styles.appTagline}>Smart Vehicle Service & Maintenance Platform</Text>
          <View style={styles.versionChip}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            FixZone is built to revolutionize vehicle maintenance in Sri Lanka. We connect vehicle owners with verified, professional service centers, making booking maintenance fast, transparent, and completely hassle-free.
          </Text>
        </View>

        {/* Why Choose FixZone Features */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why Choose FixZone?</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="calendar-outline" size={22} color="#E84E0F" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Instant Slot Reservation</Text>
              <Text style={styles.featureSubtitle}>Book your exact preferred time slot with real-time center availability.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="card-outline" size={22} color="#E84E0F" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Transparent Online Payments</Text>
              <Text style={styles.featureSubtitle}>Securely pay a 40% initial booking fee via Stripe to lock in your appointment.</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="notifications-outline" size={22} color="#E84E0F" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Real-Time Tracking</Text>
              <Text style={styles.featureSubtitle}>Get instant notifications when your service starts and when your vehicle is ready for pickup.</Text>
            </View>
          </View>
        </View>

        {/* Developer Team Section */}
        <View style={styles.teamCard}>
          <View style={styles.teamHeader}>
            <View style={styles.teamBadge}>
              <Ionicons name="code-slash-outline" size={22} color="#E84E0F" />
            </View>
            <View>
              <Text style={styles.teamTitle}>Developed by SyntaxSoul</Text>
              <Text style={styles.teamSubtitle}>Engineering & Development Team</Text>
            </View>
          </View>
          <Text style={styles.paragraph}>
            SyntaxSoul is a dedicated developer team focused on designing and developing innovative, user-friendly software solutions. The team collaborates across different areas of software development, including frontend, backend, database management, and system integration, to build reliable and practical applications such as FixZone.
          </Text>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 FixZone Inc. All rights reserved.</Text>
          <Text style={styles.footerSubtext}>Engineered with ❤️ by SyntaxSoul</Text>
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
  brandCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionChip: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#E84E0F',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    fontWeight: '500',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontWeight: '500',
  },
  teamCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamBadge: {
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
  teamTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  teamSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E84E0F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
  },
});
