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

interface PolicySectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  number: string;
  title: string;
  rules: string[];
}

const PolicySection = ({ icon, number, title, rules }: PolicySectionProps) => (
  <View style={styles.policyCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#E84E0F" style={styles.sectionIcon} />
      <Text style={styles.sectionTitle}>{number}. {title}</Text>
    </View>
    <View style={styles.rulesList}>
      {rules.map((rule, idx) => (
        <View key={idx} style={styles.ruleItem}>
          <View style={styles.bulletPoint} />
          <Text style={styles.ruleText}>{rule}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function BusinessPolicyScreen() {
  const router = useRouter();
  const supportEmail = 'support@fixzone.lk';

  const handleContactSupport = () => {
    const mailUrl = `mailto:${supportEmail}?subject=Business%20Policy%20Inquiry`;
    Linking.openURL(mailUrl).catch(() => {
      Alert.alert(
        'Support Contact',
        `Could not open email client automatically.\n\nPlease email your policy questions directly to:\n${supportEmail}`
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
        <Text style={styles.headerTitle}>Business Policy</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Effective Date Badge */}
        <View style={styles.dateBadge}>
          <Ionicons name="briefcase-outline" size={16} color="#E84E0F" />
          <Text style={styles.dateText}>FixZone Official Business & Booking Rules</Text>
        </View>

        <Text style={styles.introText}>
          Welcome to FixZone. The following business rules, terms, and regulations govern vehicle maintenance bookings, payment processing, service execution, cancellations, and warranties across our service network.
        </Text>

        {/* 1. Booking & Reservation Policy */}
        <PolicySection 
          icon="calendar-outline"
          number="1"
          title="Booking & Reservation Rules"
          rules={[
            'Accurate Vehicle Information: Customers must select or register exact vehicle details (Brand, Model, Year, License Plate Number) when initiating a service booking.',
            'Advance Reservation Window: Bookings must be scheduled at least 2 hours in advance to allow service centers adequate preparation time.',
            'Slot Guarantee: Service booking time slots are reserved and guaranteed only upon successful completion of the required initial advance payment.',
            '30-Minute Grace Period: Customers are granted a strict 30-minute grace period after their scheduled appointment time to drop off their vehicle at the service center.'
          ]}
        />

        {/* 2. Advance Deposit & Billing Policy */}
        <PolicySection 
          icon="card-outline"
          number="2"
          title="Deposit & Payment Regulations"
          rules={[
            'Initial Advance Deposit: A mandatory initial booking fee/deposit must be paid online via secure payment gateway (Stripe Connect) to confirm your booking.',
            'Inspection & Price Adjustments: Pre-booked service package estimates cover standard maintenance. If technical inspection reveals additional necessary repairs, a revised quotation will be provided for customer approval prior to starting work.',
            'Final Payment Settlement: Remaining invoice balances for extra labor, parts, or additional services must be settled upon service completion before vehicle release.',
            'Transparent Pricing: All applicable taxes, parts costs, and labor charges are itemized in your digital invoice.'
          ]}
        />

        {/* 3. Cancellation & Rescheduling Regulations */}
        <PolicySection 
          icon="refresh-circle-outline"
          number="3"
          title="Cancellation & Reschedule Policy"
          rules={[
            'Full Refund (3+ Days Notice): Voluntary cancellations made at least 3 days (72 hours) before the scheduled appointment date receive a 100% full refund of the initial booking deposit with zero penalty.',
            'Late Cancellation Penalty (Within 3 Days): Voluntary cancellations made within 3 days of the scheduled appointment date incur a 5% administrative penalty, with the remaining 95% refunded to your payment card.',
            'Automatic Cancellation & No-Show Penalty (30-Min Grace Period): If a vehicle is not dropped off within 30 minutes of the scheduled appointment time, the system will automatically cancel the booking and deduct a 90% penalty from the booking fee.',
            'Rescheduling Window: Bookings can be rescheduled without penalty at least 3 days prior to the scheduled appointment date, subject to slot availability at the service center.'
          ]}
        />

        {/* 4. Vehicle Handover & Valuables Policy */}
        <PolicySection 
          icon="car-sport-outline"
          number="4"
          title="Vehicle Handover & Personal Belongings"
          rules={[
            'Removal of Valuables: Customers must remove all valuable personal belongings, electronics, cash, and documents from the vehicle prior to drop-off.',
            'Liability Disclaimer: FixZone and partner service centers are not responsible for uncollected or missing personal items left inside the vehicle.',
            'Condition Check: A joint physical or digital inspection will record pre-existing scratches, body damage, fuel levels, and odometer reading upon drop-off.'
          ]}
        />

        {/* 5. Warranty & Service Guarantee */}
        <PolicySection 
          icon="shield-checkmark-outline"
          number="5"
          title="Service Guarantee & Parts Warranty"
          rules={[
            'Workmanship Guarantee: Repairs and maintenance performed by FixZone partner centers carry a 30-day or 1,000 km warranty (whichever comes first) on labor.',
            'Genuine Parts Warranty: Replaced genuine OEM parts are backed by the respective manufacturer or supplier warranty.',
            'Warranty Exclusions: Warranty coverage excludes pre-existing faults, normal wear-and-tear, unapproved post-service modifications, or commercial abuse.'
          ]}
        />

        {/* 6. Vehicle Pick-up & Storage Fee Regulations */}
        <PolicySection 
          icon="time-outline"
          number="6"
          title="Vehicle Pick-up & Storage Terms"
          rules={[
            'Completion Notification: Customers receive real-time push notifications and status updates when their vehicle service reaches "Completed".',
            'Pick-up Grace Period: Vehicles must be collected within 24 hours of completion notification.',
            'Overnight Storage Fee: Vehicles uncollected after 48 hours without prior notice may incur a daily storage fee of LKR 1,000 / day.'
          ]}
        />

        {/* 7. Fair Conduct & Account Compliance */}
        <PolicySection 
          icon="people-outline"
          number="7"
          title="Customer Rights & Conduct Regulations"
          rules={[
            'Respectful Communication: Customers are expected to treat service advisors and mechanics with courtesy and respect.',
            'Fraudulent Activity: Creating fake bookings, abusing cancellation features, or non-payment of final invoices will result in immediate account suspension.',
            'Dispute Resolution: Any operational or billing disputes will be reviewed and mediated by FixZone Customer Support.'
          ]}
        />

        {/* Support & Contact Card */}
        <View style={styles.concernCard}>
          <View style={styles.concernHeader}>
            <View style={styles.concernIconCircle}>
              <Ionicons name="help-buoy-outline" size={24} color="#E84E0F" />
            </View>
            <View style={styles.concernHeaderText}>
              <Text style={styles.concernTitle}>Questions About Business Policy?</Text>
              <Text style={styles.concernSubtitle}>
                If you need clarification regarding booking rules, payment policies, or service terms, reach out to our team.
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.emailBtn}
            onPress={handleContactSupport}
            activeOpacity={0.8}
          >
            <Text style={styles.emailBtnText}>Contact Business Support Team</Text>
          </TouchableOpacity>

          <Text style={styles.responseTimeText}>
            • Business support available Mon - Sat (8:00 AM - 6:00 PM)
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
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E84E0F',
    marginTop: 8,
    marginRight: 10,
  },
  ruleText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 21,
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
  responseTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 10,
    textAlign: 'center',
  },
});
