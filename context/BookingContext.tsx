import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_BOOKINGS, Booking } from '../constants/mock_data';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  pendingBookings: Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  const addBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);
  };

  const pendingBookings = bookings.filter(b => b.status === 'Pending');

  return (
    <BookingContext.Provider value={{ bookings, addBooking, pendingBookings }}>
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
