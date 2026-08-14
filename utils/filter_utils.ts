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

    // Collect service types (package names)
    if (center.servicePackages) {
      center.servicePackages.forEach(pkg => {
        if (pkg.name) {
          serviceTypes.add(pkg.name);
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

  // 1. Text Search Filter
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.managerName?.toLowerCase().includes(q) ||
        c.servicePackages?.some(p => p.name?.toLowerCase().includes(q) || (p as any).description?.toLowerCase().includes(q))
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

  // 3. Filter by Service Type
  if (filters.serviceType) {
    const target = filters.serviceType.toLowerCase();
    result = result.filter(c => {
      if (!c.servicePackages || c.servicePackages.length === 0) return false;
      return c.servicePackages.some(p => p.name?.toLowerCase() === target);
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
      // Very basic check - just require it to be active for now
      result = result.filter(c => c.isActive !== false);
    }
    // "24/7" could look for '24' in opening hours, etc.
    if (filters.availability === '24/7') {
      result = result.filter(c => c.openingHours && c.openingHours.includes('24'));
    }
  }

  return result;
}
