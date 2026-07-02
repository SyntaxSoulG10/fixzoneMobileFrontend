import { Linking, Platform } from 'react-native';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (degree: number) => degree * (Math.PI / 180);

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
};

/**
 * Attempts to open native map apps (Google Maps, then Apple Maps) to the specific coordinates.
 * Falls back to a browser URL if apps are not installed.
 */
export const openDirections = async (lat: number, lng: number, label: string) => {
  const latLng = `${lat},${lng}`;
  const encodedLabel = encodeURIComponent(label);

  const googleMapsUrl = Platform.select({
    ios: `comgooglemaps://?q=${encodedLabel}&center=${latLng}`,
    android: `geo:0,0?q=${latLng}(${encodedLabel})`
  });

  const appleMapsUrl = `maps://0,0?q=${encodedLabel}@${latLng}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}`;

  try {
    if (googleMapsUrl && await Linking.canOpenURL(googleMapsUrl)) {
      await Linking.openURL(googleMapsUrl);
    } else if (Platform.OS === 'ios' && await Linking.canOpenURL(appleMapsUrl)) {
      await Linking.openURL(appleMapsUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error("Could not open maps", error);
    await Linking.openURL(webUrl); // Ultimate fallback
  }
};
