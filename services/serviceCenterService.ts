import { request } from './api';

export interface ServicePackageDTO {
  id?: string;
  packageId?: string;
  name: string;
  price: number;
  basePrice?: number;
  duration?: string;
  estimatedDurationMins?: number;
  features?: string[];
  description?: string;
  image?: any;
  isRecommended?: boolean;
  vehicleType?: string;
}

export interface ServiceCenterDTO {
  centerId: string;
  ownerId?: string;
  name: string;
  managerName?: string;
  address: string;
  contactPhone: string;
  openingHours?: string;
  rating?: number;
  isActive?: boolean;
  supportedVehicleBrands?: string[];
  status?: string;
  servicePackages?: ServicePackageDTO[];
  imageUrl?: string;
}

export const serviceCenterService = {
  getAllServiceCenters: async (): Promise<ServiceCenterDTO[]> => {
    return request<ServiceCenterDTO[]>('/service-centers');
  },

  getServiceCenterById: async (id: string): Promise<ServiceCenterDTO> => {
    return request<ServiceCenterDTO>(`/service-centers/${id}`);
  }
};
