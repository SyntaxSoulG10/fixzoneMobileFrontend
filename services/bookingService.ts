import { request } from './api';

export interface BookingResponseDTO {
  bookingId: string;
  centerId: string;
  customerId: string;
  vehicleId: string;
  packageId: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  serviceCenterName: string;
  packageName: string;
  estimatedCost?: number;
  bookingFee?: number;
}

export interface BookingRequestDTO {
  centerId: string;
  packageId: string;
  vehicleId: string;
  bookingDate: string; // ISO Date YYYY-MM-DD
  bookingTime: string; // HH:mm
  customerId: string;
  specialRequest?: string;
}

export const bookingService = {
  getAvailableSlots: async (centerId: string, date: string): Promise<string[]> => {
    return request<string[]>(`/bookings/available-slots?centerId=${centerId}&date=${date}`, {
      method: 'GET'
    });
  },

  createBooking: async (data: BookingRequestDTO): Promise<BookingResponseDTO> => {
    return request<BookingResponseDTO>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getBookingById: async (id: string): Promise<BookingResponseDTO> => {
    return request<BookingResponseDTO>(`/bookings/${id}`, {
      method: 'GET'
    });
  },

  cancelBooking: async (id: string): Promise<BookingResponseDTO> => {
    return request<BookingResponseDTO>(`/bookings/${id}/cancel`, {
      method: 'PUT'
    });
  },

  getBookingsByCustomer: async (customerId: string): Promise<BookingResponseDTO[]> => {
    return request<BookingResponseDTO[]>(`/bookings/customer/${customerId}`, {
      method: 'GET'
    });
  },

  rescheduleBooking: async (id: string, newDate: string, newTime: string): Promise<BookingResponseDTO> => {
    return request<BookingResponseDTO>(`/bookings/${id}/reschedule?newDate=${newDate}&newTime=${newTime}`, {
      method: 'PUT'
    });
  },

  completePayment: async (id: string, gatewaySessionId: string): Promise<BookingResponseDTO> => {
    return request<BookingResponseDTO>(`/bookings/${id}/payment?gatewaySessionId=${gatewaySessionId}`, {
      method: 'POST'
    });
  }
};
