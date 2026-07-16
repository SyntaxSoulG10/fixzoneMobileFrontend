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
  emailVerified: boolean;
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
  updateProfileImage: async (userId: string, imageData: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/customer/profile/picture`, {
      method: 'POST',
      body: JSON.stringify({ imageData }),
    });
  },
  updateProfile: async (userId: string, fullName: string, phone: string): Promise<{ message: string }> => {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const secondName = nameParts.slice(1).join(' ') || '';
    return request<{ message: string }>(`/customer/profile`, {
      method: 'PUT',
      body: JSON.stringify({ firstName, secondName, phoneNumber: phone }),
    });
  },
  verifyOtp: async (email: string, otpCode: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });
  },
  resendOtp: async (email: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};
