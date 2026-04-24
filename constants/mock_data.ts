export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: string;
  lastService: string;
  image: any;
}

export type VehicleType = 'bike' | 'car' | 'van' | 'lorry';

export interface ServicePackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  image: any;
  isRecommended: boolean;
  vehicleType: VehicleType;
}

export interface ServiceCenter {
  id: string;
  name: string;
  location: string;
  type: string;
  distance: string;
  image: any;
  rating: number;
  ratingCount: number;
  priceFrom: number;
  openUntil: string;
  isVerified: boolean;
  supportedVehicles: VehicleType[];
  openingTime: string;
  closingTime: string;
  packages: ServicePackage[];
}

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Honda Vezel',
    plate: 'WP BCY 9454',
    status: 'Service Due',
    lastService: '06/02/2026',
    image: require('../assets/images/honda_vezel_silver.jpg')
  },
  {
    id: '2',
    name: 'Honda Civic',
    plate: 'WP CAD 1234',
    status: 'Up to date',
    lastService: '15/01/2026',
    image: require('../assets/images/honda_civic_red.jpg')
  }
];

const CAR_PACKAGES: ServicePackage[] = [
  {
    id: 'c1',
    name: 'Gold Full Service (Car)',
    price: 15000,
    duration: '4.5 hrs',
    features: [
      'Comprehensive mechanical + diagnostics',
      'Premium interior detail (leather treatment)',
      'Engine bay cleaning',
      'Waxing/polishing with premium products',
      'Tire balancing + alignment'
    ],
    image: require('../assets/images/carcare_hub_interior.jpg'),
    isRecommended: true,
    vehicleType: 'car'
  },
  {
    id: 'c2',
    name: 'Full Service (Car)',
    price: 10000,
    duration: '3.5 hrs',
    features: [
      'Engine Oil & Filter Change',
      'Brake Inspection & Cleaning',
      'Tire Rotation',
      'Coolant Top-Up',
      'AC Filter Replacement'
    ],
    image: require('../assets/images/elite_auto_detailing.jpg'),
    isRecommended: false,
    vehicleType: 'car'
  }
];

const BIKE_PACKAGES: ServicePackage[] = [
  {
    id: 'b1',
    name: 'Gold Package (Bike)',
    price: 8000,
    duration: '4 hrs',
    features: [
      'Engine Oil & Filter Change',
      'Brake Inspection & Cleaning',
      'Tire Rotation',
      'Coolant Top-Up',
      'AC Filter Replacement'
    ],
    image: require('../assets/images/speedworks_tuning.jpg'),
    isRecommended: true,
    vehicleType: 'bike'
  },
  {
    id: 'b2',
    name: 'Silver Service (Bike)',
    price: 4500,
    duration: '2 hrs',
    features: [
      'Basic engine service',
      'Chain adjustment & lubrication',
      'Brake check',
      'Full wash & wax'
    ],
    image: require('../assets/images/speedworks_tuning.jpg'),
    isRecommended: false,
    vehicleType: 'bike'
  }
];

const VAN_PACKAGES: ServicePackage[] = [
  {
    id: 'v1',
    name: 'Commercial Van Service',
    price: 12000,
    duration: '5 hrs',
    features: [
      'Heavy duty engine oil',
      'Suspension check',
      'Brake system overhaul',
      'Wheel alignment'
    ],
    image: require('../assets/images/prime_motors_general.jpg'),
    isRecommended: true,
    vehicleType: 'van'
  }
];

export const MOCK_SERVICE_CENTERS: ServiceCenter[] = [
  {
    id: '1',
    name: 'Auto Expert Premium Garage',
    location: 'Colombo 07',
    type: 'Hybrid Specialist',
    distance: '2.4 km',
    image: require('../assets/images/automiraj_exterior.jpg'),
    rating: 4.8,
    ratingCount: 120,
    priceFrom: 4500,
    openUntil: '6.00 PM',
    isVerified: true,
    supportedVehicles: ['bike', 'car', 'van'],
    openingTime: '08:00',
    closingTime: '18:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '2',
    name: 'CarCare Hub Specialist',
    location: 'Kandy 02',
    type: 'Hybrid Specialist',
    distance: '24 km',
    image: require('../assets/images/carcare_hub_interior.jpg'),
    rating: 4.5,
    ratingCount: 85,
    priceFrom: 3800,
    openUntil: '5.30 PM',
    isVerified: false,
    supportedVehicles: ['car', 'van'],
    openingTime: '08:30',
    closingTime: '17:30',
    packages: [...CAR_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '3',
    name: 'SpeedWorks Performance',
    location: 'Colombo 03',
    type: 'Engine Specialist',
    distance: '1.5 km',
    image: require('../assets/images/speedworks_tuning.jpg'),
    rating: 4.9,
    ratingCount: 210,
    priceFrom: 5000,
    openUntil: '7.00 PM',
    isVerified: true,
    supportedVehicles: ['car', 'van', 'lorry'],
    openingTime: '09:00',
    closingTime: '19:00',
    packages: [...CAR_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '4',
    name: 'Prime Motors General',
    location: 'Colombo 05',
    type: 'General Service',
    distance: '3.2 km',
    image: require('../assets/images/prime_motors_general.jpg'),
    rating: 4.2,
    ratingCount: 64,
    priceFrom: 3200,
    openUntil: '6.00 PM',
    isVerified: false,
    supportedVehicles: ['bike', 'car'],
    openingTime: '08:00',
    closingTime: '18:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES]
  },
  {
    id: '5',
    name: 'Elite Motor Service',
    location: 'Colombo 07',
    type: 'Tire & Alignment',
    distance: '3.4 km',
    image: require('../assets/images/tire_master_shop.jpg'),
    rating: 4.8,
    ratingCount: 120,
    priceFrom: 4900,
    openUntil: '4.00 PM',
    isVerified: true,
    supportedVehicles: ['bike', 'car'],
    openingTime: '08:00',
    closingTime: '16:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES]
  },
  {
    id: '6',
    name: 'ElectroFix Electrical',
    location: 'Nugegoda',
    type: 'Electrical Specialist',
    distance: '6.1 km',
    image: require('../assets/images/electrofix_electrical.jpg'),
    rating: 4.6,
    ratingCount: 45,
    priceFrom: 2500,
    openUntil: '5.00 PM',
    isVerified: true,
    supportedVehicles: ['bike', 'car', 'van'],
    openingTime: '08:00',
    closingTime: '17:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '7',
    name: 'Elite Auto Care',
    location: 'Battaramulla',
    type: 'Premium Detailing',
    distance: '8.5 km',
    image: require('../assets/images/elite_auto_detailing.jpg'),
    rating: 4.9,
    ratingCount: 156,
    priceFrom: 12000,
    openUntil: '8.00 PM',
    isVerified: true,
    supportedVehicles: ['car'],
    openingTime: '09:00',
    closingTime: '20:00',
    packages: CAR_PACKAGES
  },
  {
    id: '8',
    name: 'Quick Service Point',
    location: 'Malabe',
    type: 'Express Service',
    distance: '12 km',
    image: require('../assets/images/quick_service_express.jpg'),
    rating: 4.0,
    ratingCount: 32,
    priceFrom: 1500,
    openUntil: '6.00 PM',
    isVerified: false,
    supportedVehicles: ['bike', 'car'],
    openingTime: '08:00',
    closingTime: '18:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES]
  },
  {
    id: '9',
    name: 'City Car Wash',
    location: 'Colombo 03',
    type: 'Full Service Wash',
    distance: '1.2 km',
    image: require('../assets/images/elite_auto_detailing.jpg'),
    rating: 4.7,
    ratingCount: 98,
    priceFrom: 2000,
    openUntil: '7.00 PM',
    isVerified: true,
    supportedVehicles: ['bike', 'car', 'van'],
    openingTime: '08:00',
    closingTime: '19:00',
    packages: [...CAR_PACKAGES, ...BIKE_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '10',
    name: 'Lanka Motors General',
    location: 'Wattala',
    type: 'General Service',
    distance: '9.2 km',
    image: require('../assets/images/prime_motors_general.jpg'),
    rating: 4.3,
    ratingCount: 76,
    priceFrom: 3000,
    openUntil: '6.30 PM',
    isVerified: true,
    supportedVehicles: ['car', 'van', 'lorry'],
    openingTime: '08:30',
    closingTime: '18:30',
    packages: [...CAR_PACKAGES, ...VAN_PACKAGES]
  },
  {
    id: '11',
    name: 'Hybrid Hub Specialist',
    location: 'Dehiwala',
    type: 'Hybrid Specialist',
    distance: '5.5 km',
    image: require('../assets/images/carcare_hub_interior.jpg'),
    rating: 4.7,
    ratingCount: 112,
    priceFrom: 4200,
    openUntil: '6.00 PM',
    isVerified: true,
    supportedVehicles: ['car'],
    openingTime: '08:00',
    closingTime: '18:00',
    packages: CAR_PACKAGES
  },
  {
    id: '12',
    name: 'Gear Box Pro',
    location: 'Rajagiriya',
    type: 'Transmission Expert',
    distance: '4.1 km',
    image: require('../assets/images/speedworks_tuning.jpg'),
    rating: 4.8,
    ratingCount: 54,
    priceFrom: 8500,
    openUntil: '5.30 PM',
    isVerified: false,
    supportedVehicles: ['car', 'van'],
    openingTime: '08:30',
    closingTime: '17:30',
    packages: [...CAR_PACKAGES, ...VAN_PACKAGES]
  }
];

export interface Booking {
  id: string;
  centerId: string;
  packageId: string;
  vehicleId: string;
  date: string;
  month: string;
  year: string;
  time: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  totalPrice: number;
  bookingFee: number;
  paymentMethod?: string;
  invoiceId?: string;
}

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    centerId: '2',
    packageId: 'c1',
    vehicleId: '2',
    date: '24',
    month: 'Oct',
    year: '2026',
    time: '10:00 AM',
    status: 'Pending',
    totalPrice: 15000,
    bookingFee: 1500,
  },
  {
    id: 'b2',
    centerId: '2',
    packageId: 'c1',
    vehicleId: '2',
    date: '14',
    month: 'Feb',
    year: '2026',
    time: '08:00 AM',
    status: 'Completed',
    totalPrice: 15000,
    bookingFee: 1500,
    paymentMethod: 'Credit Card',
    invoiceId: 'INV-2026-001'
  },
  {
    id: 'b3',
    centerId: '2',
    packageId: 'c2',
    vehicleId: '2',
    date: '28',
    month: 'Jan',
    year: '2026',
    time: '02:00 PM',
    status: 'Completed',
    totalPrice: 14000,
    bookingFee: 1400,
    paymentMethod: 'Lanka QR',
    invoiceId: 'INV-2026-002'
  }
];

export interface Promotion {
  id: string;
  title: string;
  centerName: string;
  location: string;
  description: string;
  expiryDate: string;
  image: any;
}

export const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 'p1',
    title: '15% Off Winter Check-Up',
    centerName: 'Automiraj',
    location: 'Colombo 07',
    description: 'Keep your vehicle safe and reliable this season with a full winter inspection.',
    expiryDate: 'Expires Dec 31',
    image: require('../assets/images/automiraj_exterior.jpg'),
  },
  {
    id: 'p2',
    title: 'Loyalty Reward',
    centerName: 'Automiraj',
    location: 'Colombo 07',
    description: 'Exclusive reward for returning customers—your next oil change is on us.',
    expiryDate: 'Valid until Nov 15',
    image: require('../assets/images/prime_motors_general.jpg'),
  },
  {
    id: 'p3',
    title: 'Free AC Service',
    centerName: 'ElectroFix Electrical',
    location: 'Nugegoda',
    description: 'Get a free AC gas top-up and filter cleaning with any full service package.',
    expiryDate: 'Expires Oct 30',
    image: require('../assets/images/electrofix_electrical.jpg'),
  },
  {
    id: 'p4',
    title: 'Brake Safety Month',
    centerName: 'SpeedWorks Performance',
    location: 'Colombo 03',
    description: 'Complimentary brake pad inspection and cleaning for all vehicle types.',
    expiryDate: 'Valid until Nov 30',
    image: require('../assets/images/speedworks_tuning.jpg'),
  }
];

export const MOCK_USER = {
  name: 'Welcome Chanuka',
  profileImage: require('../assets/images/user_profile_chanuka.jpg'),
  notifications: 3
};
