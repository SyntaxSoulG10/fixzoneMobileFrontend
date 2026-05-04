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
