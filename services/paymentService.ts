import { request } from './api';

export interface InitPaymentRequest {
  servicePackageId: string;
  vehicleId: string;
  date: string;
  timeSlot: string;
  centerId?: string;
  bookingId?: string;
}

export interface PaymentIntentResponse {
  paymentId: number;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface PaymentStatusResponse {
  status: string; // e.g., 'PAID', 'PENDING'
}

export const paymentService = {
  initPayment: async (data: InitPaymentRequest): Promise<{ paymentId: number, stripeConnected: boolean, message: string }> => {
    return request<{ paymentId: number, stripeConnected: boolean, message: string }>('/payments/init', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  preparePaymentSheet: async (paymentId: number): Promise<PaymentIntentResponse> => {
    return request<PaymentIntentResponse>('/payments/stripe/mobile-sheet', {
      method: 'POST',
      body: JSON.stringify({ paymentId }),
    });
  },
  
  verifyPaymentStatus: async (paymentId: number): Promise<PaymentStatusResponse> => {
    return request<PaymentStatusResponse>(`/payments/payment-status/${paymentId}`, {
      method: 'GET',
    });
  }
};
