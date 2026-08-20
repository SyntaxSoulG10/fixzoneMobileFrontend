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
  imageUrl?: string;
  isRecommended?: boolean;
  vehicleType?: string;
  type?: string;
}

export interface ServiceCenterDTO {
  centerId: string;
  ownerId?: string;
  name: string;
  managerName?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactPhone: string;
  openingHours?: string;
  rating?: number;
  isActive?: boolean;
  supportedVehicleBrands?: string[];
  status?: string;
  servicePackages?: ServicePackageDTO[];
  imageUrl?: string;
  leaveDates?: string[];
}

export interface PagedResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const serviceCenterService = {
  getAllServiceCenters: async (page = 0, size = 10): Promise<PagedResponse<ServiceCenterDTO>> => {
    return request<PagedResponse<ServiceCenterDTO>>(`/service-centers?page=${page}&size=${size}`);
  },

  getNearbyServiceCenters: async (lat: number, lng: number, radius = 15, page = 0, size = 10): Promise<PagedResponse<ServiceCenterDTO>> => {
    return request<PagedResponse<ServiceCenterDTO>>(`/service-centers/nearby?lat=${lat}&lng=${lng}&radius=${radius}&page=${page}&size=${size}`);
  },

  getServiceCenterById: async (id: string): Promise<ServiceCenterDTO> => {
    return request<ServiceCenterDTO>(`/service-centers/${id}`);
  },

  getTrustedCenters: async (customerId: string): Promise<ServiceCenterDTO[]> => {
    return request<ServiceCenterDTO[]>(`/customers/${customerId}/trusted-service-centers`);
  }
};
