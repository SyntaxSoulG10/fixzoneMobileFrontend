import { request } from './api';

export interface VehicleResponse {
  id: string;
  customerId: string;
  brand: string;
  model: string;
  vehicleType: string;
  plateNumber: string;
  imageUrl: string;
  lastServiceDate: string;
  daysSinceService?: number;
}

export interface VehicleCreateRequest {
  customerId: string;
  brand: string;
  model: string;
  vehicleType: string;
  plateNumber: string;
  imageUrl?: string;
  lastServiceDate?: string;
}

export const vehicleService = {
  getVehiclesByUser: async (customerId: string): Promise<VehicleResponse[]> => {
    return request<VehicleResponse[]>(`/customer/vehicles`, {
      method: 'GET',
    });
  },

  createVehicle: async (data: VehicleCreateRequest): Promise<VehicleResponse> => {
    return request<VehicleResponse>('/customer/vehicle', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateVehicle: async (vehicleId: string, data: Partial<VehicleCreateRequest>): Promise<VehicleResponse> => {
    return request<VehicleResponse>(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteVehicle: async (vehicleId: string): Promise<void> => {
    return request<void>(`/customer/vehicle/${vehicleId}`, {
      method: 'DELETE',
    });
  },
};

