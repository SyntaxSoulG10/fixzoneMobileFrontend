import { request } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  role: string;
  fullName: string;
  profilePictureUrl?: string;
  phone?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  registerCustomer: async (data: RegisterRequest): Promise<LoginResponse> => {
    return request<LoginResponse>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateProfileImage: async (userId: string, imageUrl: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/users/${userId}/profile-image`, {
      method: 'PUT',
      body: JSON.stringify({ imageUrl }),
    });
  },
  updateProfile: async (userId: string, fullName: string, phone: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ fullName, phone }),
    });
  },
};
