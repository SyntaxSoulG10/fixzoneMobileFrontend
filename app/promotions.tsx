import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PROMOTIONS, Promotion } from '../constants/mock_data';

const { width } = Dimensions.get('window');

export default function PromotionsScreen() {
  const router = useRouter();

  const renderPromoCard = (promo: Promotion) => (
    <View key={promo.id} style={styles.card}>
      <Image source={promo.image} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.promoTitle}>{promo.title}</Text>
        <Text style={styles.promoLocation}>
          {promo.centerName} - {promo.location}
        </Text>
        <Text style={styles.promoDescription}>{promo.description}</Text>
        
        <View style={styles.footerRow}>
          <Text style={styles.expiryDate}>{promo.expiryDate}</Text>
          <TouchableOpacity style={styles.claimButton}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotion</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_PROMOTIONS.map(renderPromoCard)}
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
  },
  card: {
    backgroundColor: '#D9D7D2',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  promoLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E84E0F',
    marginBottom: 10,
  },
  promoDescription: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryDate: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  claimButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
  },
  claimButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});
