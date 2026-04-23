export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: string;
  lastService: string;
  image: string;
}

export interface ServiceCenter {
  id: string;
  name: string;
  location: string;
  type: string;
  distance: string;
  image: string;
}

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    name: 'Honda Vezel',
    plate: 'WP BCY 9454',
    status: 'Service Due',
    lastService: '06/02/2026',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Honda Civic',
    plate: 'WP CAD 1234',
    status: 'Up to date',
    lastService: '15/01/2026',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=500&auto=format&fit=crop'
  }
];

export const MOCK_SERVICE_CENTERS: ServiceCenter[] = [
  {
    id: '1',
    name: 'AutoMiraj',
    location: 'Colombo 07',
    type: 'Hybrid Specialist',
    distance: '2.4 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'CarCare Hub',
    location: 'Kandy 02',
    type: 'Hybrid Specialist',
    distance: '24 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'SpeedWorks',
    location: 'Colombo 03',
    type: 'Engine Specialist',
    distance: '1.5 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Prime Motors',
    location: 'Colombo 05',
    type: 'General Service',
    distance: '3.2 km',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'
  }
];

export const MOCK_USER = {
  name: 'Ayubowan Chanuka',
  profileImage: 'https://i.pravatar.cc/100?u=chanuka',
  notifications: 3
};
