import { ServiceCenterDTO } from '../services/serviceCenterService';
import { FilterState } from '../components/home/FilterBottomSheet';
import { calculateDistance } from './location_utils';

export function extractFilterOptions(centers: ServiceCenterDTO[]) {
  const vehicleTypes = new Set<string>();
  const serviceTypes = new Set<string>();

  centers.forEach(center => {
    // Collect vehicle types
    if (center.supportedVehicleBrands) {
      center.supportedVehicleBrands.forEach(brand => {
        // Just capitalize the first letter for consistency
        const name = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
        vehicleTypes.add(name);
      });
    }

    // Collect service types (filtered from package type, fallback to name)
    if (center.servicePackages) {
      center.servicePackages.forEach(pkg => {
        const pkgType = pkg.type || (pkg as any).packageType || pkg.name;
        if (pkgType) {
          serviceTypes.add(pkgType);
        }
      });
    }
  });

  return {
    availableVehicles: Array.from(vehicleTypes).sort(),
    availableServices: Array.from(serviceTypes).sort(),
  };
}

export function applyFilters(
  centers: ServiceCenterDTO[],
  filters: FilterState,
  searchQuery: string,
  userLocation: { coords: { latitude: number; longitude: number } } | null
): ServiceCenterDTO[] {
  let result = [...centers];

  // 1. Text Search Filter (Center Name, Address, Package Name & Package Description)
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.servicePackages?.some(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    );
  }

  // 2. Filter by Vehicle Type
  if (filters.vehicleType) {
    const target = filters.vehicleType.toLowerCase();
    result = result.filter(c => {
      if (!c.supportedVehicleBrands || c.supportedVehicleBrands.length === 0) return true; // Assume all if none specified
      return c.supportedVehicleBrands.some(v => v.toLowerCase().includes(target));
    });
  }

  // 3. Price Filter (Low to High / High to Low)
  if (filters.price) {
    result.sort((a, b) => {
      const getMinPrice = (c: ServiceCenterDTO) => {
        if (!c.servicePackages || c.servicePackages.length === 0) return 0;
        return Math.min(...c.servicePackages.map(p => p.price || (p as any).basePrice || 0));
      };
      const priceA = getMinPrice(a);
      const priceB = getMinPrice(b);
      return filters.price === 'Low to High' ? priceA - priceB : priceB - priceA;
    });
  }

  // 4. Filter by Distance
  if (filters.distance && userLocation) {
    const maxKm = filters.distance.includes('Nearby') ? 5 : parseInt(filters.distance.replace('km', ''));
    if (!isNaN(maxKm)) {
      result = result.filter(c => {
        if (c.latitude && c.longitude) {
          const dist = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            c.latitude,
            c.longitude
          );
          return dist <= maxKm;
        }
        return false; // Skip if we don't know the location and strict distance is requested
      });
    }
  }

  // 5. Filter by Availability (Status)
  if (filters.availability) {
    if (filters.availability === 'Open Now') {
      result = result.filter(c => c.isActive !== false);
    }
    if (filters.availability === '24/7') {
      result = result.filter(c => c.openingHours && c.openingHours.includes('24'));
    }
  }

  return result;
}
