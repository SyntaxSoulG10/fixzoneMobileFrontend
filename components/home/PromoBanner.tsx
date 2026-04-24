import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Booking, MOCK_SERVICE_CENTERS, MOCK_VEHICLES } from '../../constants/mock_data';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 40;
const SNAP_INTERVAL = BANNER_WIDTH + 20;

interface PromoBannerProps {
  pendingBookings?: Booking[];
}

export default function PromoBanner({ pendingBookings = [] }: PromoBannerProps) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const allBanners = [...pendingBookings.map(b => ({ type: 'pending', data: b })), { type: 'promo' }];

  useEffect(() => {
    if (allBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= allBanners.length) {
        nextIndex = 0;
      }
      
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SNAP_INTERVAL,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(timer);
  }, [currentIndex, allBanners.length, isPaused]);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SNAP_INTERVAL);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const onTouchStart = () => setIsPaused(true);
  const onTouchEnd = () => {
    // Resume after a short delay
    setTimeout(() => setIsPaused(false), 2000);
  };

  const renderDefaultPromo = () => (
    <View key="default-promo" style={[styles.bannerContainer, { backgroundColor: COLORS.primary }]}>
      <View style={styles.content}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>INSTANT BOOKING</Text>
        </View>
        <Text style={styles.title}>Quick Service</Text>
        <Text style={styles.subtitle}>
          Expert vehicle maintenance at your doorstep in minutes
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(tabs)/book')}
        >
          <Text style={[styles.buttonText, { color: COLORS.primary }]}>Book Now</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.abstractShape} />
    </View>
  );

  const renderPendingBooking = (booking: Booking) => {
    const center = MOCK_SERVICE_CENTERS.find(c => c.id === booking.centerId);
    const vehicle = MOCK_VEHICLES.find(v => v.id === booking.vehicleId);

    return (
      <View key={booking.id} style={[styles.bannerContainer, { backgroundColor: COLORS.primary }]}>
        <View style={styles.content}>
          <View style={[styles.tag, { backgroundColor: '#fff' }]}>
            <Text style={[styles.tagText, { color: COLORS.primary }]}>UPCOMING SERVICE</Text>
          </View>
          <Text style={styles.title}>{center?.name || 'Service Center'}</Text>
          <Text style={styles.subtitle}>
            {vehicle?.name} • {booking.month} {booking.date}, {booking.year}
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#000' }]}
            onPress={() => router.push(`/invoice/${booking.id}`)}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.iconOverlay}>
          <Ionicons name="calendar" size={100} color="rgba(255,255,255,0.15)" />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {pendingBookings.length > 0 ? (
          <>
            {pendingBookings.map(renderPendingBooking)}
            {renderDefaultPromo()}
          </>
        ) : (
          renderDefaultPromo()
        )}
      </ScrollView>

      {/* Pagination Dots */}
      {allBanners.length > 1 && (
        <View style={styles.pagination}>
          {allBanners.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                currentIndex === i ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    marginRight: 20,
  },
  content: {
    zIndex: 10,
  },
  tag: {
    backgroundColor: '#FB923C',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    width: '80%',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  abstractShape: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ scale: 1.5 }],
  },
  iconOverlay: {
    position: 'absolute',
    right: 10,
    bottom: -10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
});
