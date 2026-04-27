import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_BOOKINGS, Booking } from '../constants/mock_data';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  rescheduleBooking: (bookingId: string, newDate: string, newMonth: string, newYear: string, newTime: string) => void;
  pendingBookings: Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  const addBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const cancelBooking = (bookingId: string) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, status: 'Cancelled' } : b
    ));
  };

  const rescheduleBooking = (bookingId: string, newDate: string, newMonth: string, newYear: string, newTime: string) => {
    setBookings(prev => prev.map(b => 
      b.id === bookingId ? { ...b, date: newDate, month: newMonth, year: newYear, time: newTime } : b
    ));
  };

  const pendingBookings = bookings.filter(b => b.status === 'Pending');

  return (
    <BookingContext.Provider value={{ bookings, addBooking, cancelBooking, rescheduleBooking, pendingBookings }}>
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
