export interface BookingDateMinimal {
  vehicleId: string;
  bookingDate: string;
  status: string;
}

/**
 * Returns the most recent COMPLETED service date that occurred on or before today.
 */
export const getLastServiceDate = (
  vehicleId: string,
  bookings: BookingDateMinimal[],
  fallbackDate?: string
): string => {
  const now = new Date();
  
  // Filter completed bookings on or before today
  const pastCompletedBookings = bookings
    .filter(b => b.vehicleId === vehicleId && b.status === 'COMPLETED')
    .filter(b => {
      const d = new Date(b.bookingDate);
      return !isNaN(d.getTime()) && d.getTime() <= now.getTime() + 86400000; // allow current day
    })
    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());

  if (pastCompletedBookings.length > 0) {
    return pastCompletedBookings[0].bookingDate;
  }

  if (fallbackDate && fallbackDate !== 'N/A' && fallbackDate.toLowerCase() !== 'not available') {
    const fallbackD = new Date(fallbackDate);
    if (!isNaN(fallbackD.getTime()) && fallbackD.getTime() <= now.getTime() + 86400000) {
      return fallbackDate;
    }
  }

  return fallbackDate && fallbackDate !== 'not available' ? fallbackDate : 'N/A';
};

export const getDaysSinceService = (dateString: string): number | undefined => {
  if (!dateString || dateString === 'N/A' || dateString.toLowerCase() === 'not available') return undefined;
  let serviceDate: Date;
  
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      serviceDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      return undefined;
    }
  } else {
    serviceDate = new Date(dateString);
  }

  if (isNaN(serviceDate.getTime())) return undefined;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const serviceMidnight = new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate());

  const diffTime = todayMidnight.getTime() - serviceMidnight.getTime();
  if (diffTime < 0) return 0; // Future date safeguard

  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

