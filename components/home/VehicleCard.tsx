import { View, Text, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { getDaysSinceService } from '../../utils/date_utils';

interface VehicleCardProps {
  image: string;
  name: string;
  plate: string;
  lastService: string;
  daysSinceService?: number;
}


export default function VehicleCard({ image, name, plate, lastService, daysSinceService }: VehicleCardProps) {
  const daysSince = daysSinceService !== undefined ? daysSinceService : getDaysSinceService(lastService);

  return (
    <TouchableOpacity 
      className="bg-gray-100 rounded-3xl overflow-hidden mr-4 w-64 border border-gray-200 shadow-sm"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}
    >
      <Image 
        source={typeof image === 'string' ? { uri: image } : image} 
        className="w-full h-32"
        resizeMode="cover"
      />
      <View className="p-4 bg-gray-200/50">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{name}</Text>
            <Text className="text-gray-500 text-xs font-medium">{plate}</Text>
          </View>
          <View className="items-end justify-center">
            <Text className="text-[12px] text-orange-600 font-bold">
              {daysSince} days
            </Text>
            <Text className="text-[9px] text-gray-600 font-medium mt-0.5">
              since service
            </Text>
          </View>
        </View>
        
        <View>
          <Text className="text-gray-900 text-sm font-bold">Last Service Date</Text>
          <Text className="text-gray-500 text-xs">{lastService}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
