import { ServiceCenter, ServicePackage, VehicleType } from '../constants/mock_data';

export interface SearchResult {
  center: ServiceCenter;
  matchType: 'exact' | 'partial' | 'ai';
  matchScore: number;
}

export interface AiFilters {
  vehicleType?: VehicleType;
  model?: string;
  service?: string;
  location?: string;
}

const MODEL_MAP: Record<string, { brand: string; type: VehicleType }> = {
  'civic': { brand: 'honda', type: 'car' },
  'vezel': { brand: 'honda', type: 'car' },
  'corolla': { brand: 'toyota', type: 'car' },
  'vitz': { brand: 'toyota', type: 'car' },
  'hornet': { brand: 'honda', type: 'bike' },
  'cbr': { brand: 'honda', type: 'bike' },
  'fz': { brand: 'yamaha', type: 'bike' },
  'hiace': { brand: 'toyota', type: 'van' },
  'caravan': { brand: 'nissan', type: 'van' },
};

/**
 * Mock AI function to simulate backend Gemini call
 */
export const mockAiSearch = async (query: string): Promise<AiFilters> => {
  const q = query.toLowerCase();
  const filters: AiFilters = {};

  // Simple heuristic for mock AI
  if (q.includes('car') || q.includes('civic') || q.includes('corolla') || q.includes('toyota')) filters.vehicleType = 'car';
  if (q.includes('bike') || q.includes('hornet') || q.includes('yamaha')) filters.vehicleType = 'bike';
  if (q.includes('van') || q.includes('hiace')) filters.vehicleType = 'van';

  if (q.includes('colombo')) filters.location = 'colombo';
  if (q.includes('kandy')) filters.location = 'kandy';

  if (q.includes('brake')) filters.service = 'brake';
  if (q.includes('oil')) filters.service = 'oil';
  if (q.includes('wash') || q.includes('clean')) filters.service = 'wash';
  if (q.includes('detail')) filters.service = 'detailing';

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return filters;
};

export const filterServiceCenters = (
  query: string,
  centers: ServiceCenter[],
  aiFilters?: AiFilters
): ServiceCenter[] => {
  const q = query.toLowerCase().trim();
  if (!q && !aiFilters) return [];

  return centers
    .map(center => {
      let score = 0;
      const centerName = center.name.toLowerCase();
      const centerLoc = center.location.toLowerCase();
      const centerType = center.type.toLowerCase();

      // 1. Text Matching (Local)
      if (centerName.includes(q)) score += 10;
      if (centerLoc.includes(q)) score += 5;
      if (centerType.includes(q)) score += 3;

      // 2. Package Matching
      const hasMatchingPackage = center.packages.some(pkg => 
        pkg.name.toLowerCase().includes(q) || 
        (pkg.features && pkg.features.some(f => f.toLowerCase().includes(q))) ||
        (pkg.type && pkg.type.toLowerCase().includes(q))
      );
      if (hasMatchingPackage) score += 7;

      // 3. Model Mapping
      const words = q.split(' ');
      words.forEach(word => {
        if (MODEL_MAP[word]) {
          const mapped = MODEL_MAP[word];
          if (center.supportedVehicles.includes(mapped.type)) score += 5;
          if (centerName.includes(mapped.brand)) score += 3;
        }
      });

      // 4. AI Filter Matching
      if (aiFilters) {
        if (aiFilters.vehicleType && center.supportedVehicles.includes(aiFilters.vehicleType)) score += 10;
        if (aiFilters.location && centerLoc.includes(aiFilters.location)) score += 10;
        if (aiFilters.service) {
            const serviceMatch = center.packages.some(pkg => 
                pkg.name.toLowerCase().includes(aiFilters.service!) || 
                (pkg.features && pkg.features.some(f => f.toLowerCase().includes(aiFilters.service!))) ||
                (pkg.type && pkg.type.toLowerCase().includes(aiFilters.service!))
            );
            if (serviceMatch) score += 15;
        }
      }

      return { center, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.center);
};
