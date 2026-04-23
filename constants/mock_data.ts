export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: string;
  lastService: string;
  image: any;
}

export interface ServiceCenter {
  id: string;
  name: string;
  location: string;
  type: string;
  distance: string;
  image: any;
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

export const MOCK_SERVICE_CENTERS: ServiceCenter[] = [
  {
    id: '1',
    name: 'AutoMiraj',
    location: 'Colombo 07',
    type: 'Hybrid Specialist',
    distance: '2.4 km',
    image: require('../assets/images/automiraj_exterior.jpg')
  },
  {
    id: '2',
    name: 'CarCare Hub',
    location: 'Kandy 02',
    type: 'Hybrid Specialist',
    distance: '24 km',
    image: require('../assets/images/carcare_hub_interior.jpg')
  },
  {
    id: '3',
    name: 'SpeedWorks',
    location: 'Colombo 03',
    type: 'Engine Specialist',
    distance: '1.5 km',
    image: require('../assets/images/speedworks_tuning.jpg')
  },
  {
    id: '4',
    name: 'Prime Motors',
    location: 'Colombo 05',
    type: 'General Service',
    distance: '3.2 km',
    image: require('../assets/images/prime_motors_general.jpg')
  },
  {
    id: '5',
    name: 'Tire Master',
    location: 'Galle Road, Colombo 04',
    type: 'Tire & Alignment',
    distance: '4.8 km',
    image: require('../assets/images/tire_master_shop.jpg')
  },
  {
    id: '6',
    name: 'ElectroFix',
    location: 'Nugegoda',
    type: 'Electrical Specialist',
    distance: '6.1 km',
    image: require('../assets/images/electrofix_electrical.jpg')
  },
  {
    id: '7',
    name: 'Elite Auto Care',
    location: 'Battaramulla',
    type: 'Premium Detailing',
    distance: '8.5 km',
    image: require('../assets/images/elite_auto_detailing.jpg')
  },
  {
    id: '8',
    name: 'Quick Service Point',
    location: 'Malabe',
    type: 'Express Service',
    distance: '12 km',
    image: require('../assets/images/quick_service_express.jpg')
  }
];

export const MOCK_USER = {
  name: 'Ayubowan Chanuka',
  profileImage: require('../assets/images/user_profile_chanuka.jpg'),
  notifications: 3
};
