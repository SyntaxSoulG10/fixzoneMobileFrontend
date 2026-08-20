export interface VehicleTypeCategory {
  id: string;
  name: string;
  brands: string[];
}

export const VEHICLE_CATEGORIES: VehicleTypeCategory[] = [
  {
    id: 'bus',
    name: 'Bus / Minibus',
    brands: ['Ashok Leyland', 'Hino', 'Isuzu', 'Mercedes-Benz', 'Mitsubishi Fuso', 'Tata', 'Volvo'],
  },
  {
    id: 'car',
    name: 'Car',
    brands: ['Audi', 'BMW', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Perodua', 'Suzuki', 'Toyota'],
  },
  {
    id: 'construction',
    name: 'Construction Vehicle',
    brands: ['Caterpillar', 'Doosan', 'Hitachi', 'Hyundai', 'JCB', 'Komatsu', 'Volvo'],
  },
  {
    id: 'e-car',
    name: 'Electric Car',
    brands: ['BMW', 'BYD', 'Hyundai', 'Kia', 'Mercedes-Benz', 'MG', 'Nissan', 'Tesla'],
  },
  {
    id: 'e-bike',
    name: 'Electric Motorcycle / Bike',
    brands: ['Horwin', 'NIU', 'Ola', 'Super Soco', 'TAILG', 'Yadea'],
  },
  {
    id: 'e-scooter',
    name: 'Electric Scooter',
    brands: ['Horwin', 'NIU', 'Ola', 'Super Soco', 'Yadea'],
  },
  {
    id: 'e-three-wheel',
    name: 'Electric Three-Wheeler',
    brands: ['Bajaj', 'Mahindra', 'Piaggio', 'TVS'],
  },
  {
    id: 'lorry',
    name: 'Lorry / Truck',
    brands: ['Ashok Leyland', 'Hino', 'Isuzu', 'Mahindra', 'Mitsubishi Fuso', 'Tata', 'UD Trucks', 'Volvo'],
  },
  {
    id: 'bike',
    name: 'Motorcycle / Bike',
    brands: ['Bajaj', 'Hero', 'Honda', 'Kawasaki', 'KTM', 'Royal Enfield', 'Suzuki', 'TVS', 'Yamaha'],
  },
  {
    id: 'pickup',
    name: 'Pickup',
    brands: ['Ford', 'Isuzu', 'Mahindra', 'Mitsubishi', 'Nissan', 'Tata', 'Toyota'],
  },
  {
    id: 'scooter',
    name: 'Scooter',
    brands: ['Aprilia', 'Hero', 'Honda', 'Suzuki', 'TVS', 'Vespa', 'Yamaha'],
  },
  {
    id: 'three-wheel',
    name: 'Three-Wheeler',
    brands: ['Bajaj', 'Piaggio', 'TVS'],
  },
  {
    id: 'van',
    name: 'Van / Minivan',
    brands: ['Hyundai', 'Kia', 'Mazda', 'Mitsubishi', 'Nissan', 'Suzuki', 'Toyota'],
  },
];

export const ALL_VEHICLE_TYPE_NAMES = VEHICLE_CATEGORIES.map(c => c.name).sort((a, b) => a.localeCompare(b));

export const getBrandsForVehicleType = (typeName: string): string[] => {
  if (!typeName) return [];
  const found = VEHICLE_CATEGORIES.find(
    c => c.name.toLowerCase() === typeName.toLowerCase() || c.id.toLowerCase() === typeName.toLowerCase()
  );
  if (!found) return ['Other'];
  const sortedBrands = [...found.brands].sort((a, b) => a.localeCompare(b));
  return [...sortedBrands, 'Other'];
};
