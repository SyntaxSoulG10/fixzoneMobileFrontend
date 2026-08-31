import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

interface SupportCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

const SupportCard = ({ icon, title, subtitle, onPress }: SupportCardProps) => (
  <TouchableOpacity style={styles.supportCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={28} color="#E84E0F" />
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

interface FAQData {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQData[] = [
  {
    id: '1',
    category: 'Booking',
    question: 'How do I book a vehicle service?',
    answer: 'Browse service centers on the home screen, select your vehicle, choose a service package and time slot, then complete the 40% initial booking payment to lock in your appointment.'
  },
  {
    id: '2',
    category: 'Booking',
    question: 'How do I reschedule or cancel my booking?',
    answer: 'Go to your Service History tab, tap on an upcoming booking, and select "Reschedule" or "Cancel". Rescheduling must be done at least 3 days before your scheduled appointment date.'
  },
  {
    id: '3',
    category: 'Payments',
    question: 'What is the cancellation & refund policy?',
    answer: 'If you cancel at least 3 days before your appointment, you receive a full refund. Cancellations made within 3 days incur a 5% administrative penalty, and the remainder is refunded to your payment card.'
  },
  {
    id: '4',
    category: 'Payments',
    question: 'How do payments work on FixZone?',
    answer: 'You pay a 40% initial booking fee online via Stripe to confirm your slot. The remaining 60% balance plus any optional add-on services are paid directly at the service center upon completion.'
  },
  {
    id: '5',
    category: 'Notifications',
    question: 'How will I know when my vehicle is ready for pickup?',
    answer: 'FixZone sends real-time in-app notifications and toast alerts when work starts on your vehicle ("Service Started") and when your service is finished ("Service Completed").'
  },
  {
    id: '6',
    category: 'Account',
    question: 'Can I manage multiple vehicles on one account?',
    answer: 'Yes! Go to Profile > My Vehicles to add, edit, or remove your cars and motorbikes. You can select any of your saved vehicles when booking a service.'
  }
];

export default function SupportScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleCallUs = () => {
    Linking.openURL('tel:0719210909').catch(() => {
      Alert.alert('Support Hotline', 'Call us at 071 921 0909');
    });
  };

  const handleEmailUs = () => {
    Linking.openURL('mailto:vichanuka2@gmail.com').catch(() => {
      Alert.alert('Email Support', 'Send an email to vichanuka2@gmail.com');
    });
  };

  const handleChatUs = () => {
    Linking.openURL('tel:0719210909').catch(() => {
      Alert.alert('Live Support', 'Contact our support team at 071 921 0909 or email vichanuka2@gmail.com');
    });
  };

  const handleOurCenters = () => {
    const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=University+of+Moratuwa';
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert('Our Location', 'University of Moratuwa, Katubedda, Moratuwa, Sri Lanka');
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & FAQs</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Support Grid */}
        <View style={styles.grid}>
          <SupportCard 
            icon="chatbubble-ellipses-outline" 
            title="Chat Us" 
            subtitle="Available 24/7" 
            onPress={handleChatUs}
          />
          <SupportCard 
            icon="call-outline" 
            title="Call Us" 
            subtitle="Immediate Support" 
            onPress={handleCallUs}
          />
          <SupportCard 
            icon="mail-outline" 
            title="Email Us" 
            subtitle="Response in 24 H" 
            onPress={handleEmailUs}
          />
          <SupportCard 
            icon="location-outline" 
            title="Our Centers" 
            subtitle="Find a Branch" 
            onPress={handleOurCenters}
          />
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.faqCardWrapper}>
                  <TouchableOpacity 
                    style={styles.faqItem}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqTextContainer}>
                      <Text style={styles.faqCategory}>{item.category}</Text>
                      <Text style={styles.faqText}>{item.question}</Text>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={isExpanded ? "#E84E0F" : "#9CA3AF"} 
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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
    marginTop: -2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  supportCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    textAlign: 'center',
  },
  faqSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 20,
  },
  faqList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  faqCardWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  faqTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  faqCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E84E0F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  faqText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  answerContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    fontWeight: '500',
  },
});
