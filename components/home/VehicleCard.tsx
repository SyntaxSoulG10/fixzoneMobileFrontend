import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { getDaysSinceService } from '../../utils/date_utils';
import { getVehicleIcon } from '../../utils/vehicle_utils';
import { Ionicons } from '@expo/vector-icons';

interface VehicleCardProps {
  image: string;
  name: string;
  plate: string;
  lastService: string;
  type?: string;
  daysSinceService?: number;
}


export default function VehicleCard({ image, name, plate, lastService, type, daysSinceService }: VehicleCardProps) {
  const daysSince = daysSinceService !== undefined ? daysSinceService : getDaysSinceService(lastService);

  return (
    <View style={styles.cardContainer}>
      {image && !image.includes('via.placeholder.com') ? (
        <Image 
          source={typeof image === 'string' ? { uri: image } : image} 
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name={getVehicleIcon(type)} size={60} color="#F97316" />
        </View>
      )}
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName} numberOfLines={1}>{name}</Text>
            <Text style={styles.plateText}>{plate}</Text>
          </View>
          <View style={styles.daysContainer}>
            {daysSince !== undefined ? (
              <>
                <Text style={styles.daysText}>
                  {daysSince} days
                </Text>
                <Text style={styles.sinceText}>
                  since service
                </Text>
              </>
            ) : (
              <Text style={styles.daysText}>
                New
              </Text>
            )}
          </View>
        </View>
        
        <View>
          <Text style={styles.lastServiceLabel}>Last Service Date</Text>
          <Text style={styles.lastServiceDate}>{lastService}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 16,
    width: 256,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 128,
  },
  imagePlaceholder: {
    width: '100%',
    height: 128,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  plateText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  daysContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  daysText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: 'bold',
  },
  sinceText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 2,
  },
  lastServiceLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastServiceDate: {
    color: '#6B7280',
    fontSize: 12,
  },
});
