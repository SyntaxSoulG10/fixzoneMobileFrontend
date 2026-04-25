import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface NoResultsProps {
  query: string;
  onReset: () => void;
}

export default function NoResults({ query, onReset }: NoResultsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="search-outline" size={60} color="#D1D5DB" />
        <View style={styles.slash} />
      </View>
      
      <Text style={styles.title}>No results for &quot;{query}&quot;</Text>
      <Text style={styles.subtitle}>
        We couldn&apos;t find any service centers matching your search. Try checking the spelling or using more general terms.
      </Text>

      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Text style={styles.resetBtnText}>Clear Search</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  slash: {
    position: 'absolute',
    width: 80,
    height: 4,
    backgroundColor: '#E5E7EB',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontWeight: '500',
  },
  resetBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
