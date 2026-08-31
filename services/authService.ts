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
  getProfile: async (): Promise<{ firstName: string; secondName: string; email: string; phoneNumber: string; profilePictureUrl: string }> => {
    return request('/customer/profile');
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
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  verifyResetOtp: async (email: string, token: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
