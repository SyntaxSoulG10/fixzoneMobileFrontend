import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { bookingService, BookingResponseDTO, BookingRequestDTO } from '../services/bookingService';
import { useAuth } from './auth_context';

interface BookingContextType {
  bookings: BookingResponseDTO[];
  addBooking: (data: BookingRequestDTO) => Promise<BookingResponseDTO>;
  cancelBooking: (bookingId: string) => Promise<void>;
  rescheduleBooking: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  completePayment: (bookingId: string, gatewaySessionId: string) => Promise<void>;
  pendingBookings: BookingResponseDTO[];
  isLoading: boolean;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Helper to convert "09:00 AM" to "09:00"
const formatTimeToBackend = (time: string) => {
  if (!time || !time.includes(' ')) return time;
  const [timePart, ampm] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  let hoursNum = parseInt(hours);
  if (ampm === 'PM' && hoursNum !== 12) hoursNum += 12;
  if (ampm === 'AM' && hoursNum === 12) hoursNum = 0;
  return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser } = useAuth();

  const fetchBookings = useCallback(async (isSilent = false) => {
    if (!authUser?.userId) {
      setBookings([]);
      if (!isSilent) setIsLoading(false);
      return;
    }
    try {
      if (!isSilent && bookings.length === 0) setIsLoading(true);
      const data = await bookingService.getBookingsByCustomer(authUser.userId);
      const sorted = [...data].sort((a, b) => 
        new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
      );
      setBookings(sorted);
    } catch (e) {
      console.error('Failed to fetch bookings', e);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [authUser?.userId, bookings.length]);

  useEffect(() => {
    fetchBookings(false);

    if (!authUser?.userId) return;

    // Refresh bookings in background every 4 seconds silently
    const intervalId = setInterval(() => {
      fetchBookings(true);
    }, 4000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchBookings, authUser?.userId]);

  const addBooking = async (data: BookingRequestDTO) => {
    try {
      const formattedData = {
        ...data,
        bookingTime: formatTimeToBackend(data.bookingTime)
      };
      const response = await bookingService.createBooking(formattedData);
      await fetchBookings(false);
      return response;
    } catch (e) {
      console.error('Failed to add booking', e);
      throw e;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId);
      await fetchBookings(false);
    } catch (e) {
      console.error('Failed to cancel booking', e);
      throw e;
    }
  };

  const rescheduleBooking = async (bookingId: string, newDate: string, newTime: string) => {
    try {
      const formattedTime = formatTimeToBackend(newTime);
      await bookingService.rescheduleBooking(bookingId, newDate, formattedTime);
      await fetchBookings(false);
    } catch (e) {
      console.error('Failed to reschedule booking', e);
      throw e;
    }
  };

  const completePayment = async (bookingId: string, gatewaySessionId: string) => {
    try {
      await bookingService.completePayment(bookingId, gatewaySessionId);
      await fetchBookings(false);
    } catch (e) {
      console.error('Failed to complete payment', e);
      throw e;
    }
  };

  const pendingBookings = bookings.filter(b => 
    b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT' || b.status === 'IN_PROGRESS'
  );

  return (
    <BookingContext.Provider value={{ 
      bookings, 
      addBooking, 
      cancelBooking, 
      rescheduleBooking, 
      completePayment,
      pendingBookings,
      isLoading,
      refreshBookings: () => fetchBookings(false)
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}
