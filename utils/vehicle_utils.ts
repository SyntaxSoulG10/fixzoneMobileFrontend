export const getVehicleIcon = (type?: string) => {
  switch (type) {
    case 'Bike': return 'bicycle';
    case 'Van':
    case 'Lorry': return 'bus';
    case 'Three Wheels': return 'car-sport';
    case 'Others': return 'construct-outline';
    default: return 'car';
  }
};

/**
 * Format license number according to constraints:
 * - Convert lowercase to uppercase
 * - Allow English letters (A-Z), numbers (0-9), space, and hyphen (-)
 * - Strip out special characters, Sinhala characters, Emojis, etc.
 * - Max length 10
 */
export const formatLicenseNumber = (text: string): string => {
  if (!text) return '';
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, '')
    .slice(0, 10);
};

/**
 * Validate license number according to constraints:
 * - Required
 * - Min length: 4
 * - Max length: 10
 * - English letters, numbers, optional spaces & hyphens only
 */
export const validateLicenseNumber = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 'Vehicle plate number is required';
  }
  if (trimmed.length < 4) {
    return 'Vehicle plate number must be at least 4 characters';
  }
  if (trimmed.length > 10) {
    return 'Vehicle plate number cannot exceed 10 characters';
  }
  if (/[^A-Z0-9 -]/.test(trimmed)) {
    return 'Only English letters, numbers, spaces and hyphens allowed';
  }
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < 2) {
    return 'Enter a valid vehicle plate number';
  }
  return null;
};

export function normalizeVehicleType(rawType?: string | null): string {
  if (!rawType) return 'ALL';
  const t = rawType.toLowerCase().trim();
  if (t.includes('car') || t.includes('sedan')) return 'CAR';
  if (t.includes('suv') || t.includes('4x4')) return 'SUV';
  if (t.includes('van') || t.includes('minibus')) return 'VAN';
  if (t.includes('bike') || t.includes('motorcycle') || t.includes('scooter') || t.includes('three wheel')) return 'BIKE';
  if (t.includes('bus') || t.includes('heavy')) return 'BUS';
  if (t.includes('truck') || t.includes('lorry')) return 'TRUCK';
  if (t.includes('all')) return 'ALL';
  return t.toUpperCase();
}

export interface CompatibilityResult {
  isCompatible: boolean;
  typeMatch: boolean;
  brandMatch: boolean;
  reason?: string;
}

export function checkVehiclePackageCompatibility(
  vehicle: { vehicleType?: string; brand?: string; model?: string },
  pkg: { vehicleType?: string; vehicleBrand?: string; name?: string }
): CompatibilityResult {
  if (!vehicle || !pkg) {
    return { isCompatible: true, typeMatch: true, brandMatch: true };
  }

  const vType = normalizeVehicleType(vehicle.vehicleType);
  const pType = normalizeVehicleType(pkg.vehicleType);

  const vBrand = (vehicle.brand || '').trim().toLowerCase();
  const pBrand = (pkg.vehicleBrand || '').trim().toLowerCase();

  // 1. Type Match Check (All Types or exact category match)
  const typeMatch = (pType === 'ALL' || pType === '' || vType === pType);

  // 2. Brand Match Check (All Brands (Universal) or exact brand match)
  const brandMatch = (
    pBrand === '' || 
    pBrand === 'all' || 
    pBrand === 'all brands (universal)' || 
    pBrand.includes('all') ||
    vBrand === pBrand ||
    (vBrand !== '' && pBrand !== '' && (vBrand.includes(pBrand) || pBrand.includes(vBrand)))
  );

  const vehicleLabel = `${vehicle.brand || ''} ${vehicle.vehicleType || ''}`.trim();

  if (!typeMatch && !brandMatch) {
    return {
      isCompatible: false,
      typeMatch: false,
      brandMatch: false,
      reason: `Incompatible Vehicle: This package is restricted to ${pkg.vehicleBrand || ''} ${pkg.vehicleType || ''} vehicles. Your selected vehicle is a ${vehicleLabel}.`
    };
  }

  if (!typeMatch) {
    return {
      isCompatible: false,
      typeMatch: false,
      brandMatch: true,
      reason: `Incompatible Vehicle Type: This package is designed for ${pkg.vehicleType || 'other vehicle types'}, but your selected vehicle is a ${vehicle.vehicleType || 'different type'}.`
    };
  }

  if (!brandMatch) {
    return {
      isCompatible: false,
      typeMatch: true,
      brandMatch: false,
      reason: `Incompatible Vehicle Brand: This package is restricted to ${pkg.vehicleBrand} vehicles, but your selected vehicle is a ${vehicle.brand}.`
    };
  }

  return { isCompatible: true, typeMatch: true, brandMatch: true };
}

