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
    return 'License number is required';
  }
  if (trimmed.length < 4) {
    return 'License number must be at least 4 characters';
  }
  if (trimmed.length > 10) {
    return 'License number cannot exceed 10 characters';
  }
  if (/[^A-Z0-9 -]/.test(trimmed)) {
    return 'Only English letters, numbers, spaces and hyphens allowed';
  }
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (digitCount < 2) {
    return 'Enter a valid licence number';
  }
  return null;
};

