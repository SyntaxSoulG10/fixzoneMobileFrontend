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

/**
 * Helper to convert 12-hour formatted time strings (e.g. "02:15 PM") to 24-hour HH:mm (e.g. "14:15") for Spring Boot LocalTime deserialization.
 */
export const formatTimeToBackend = (time: string): string => {
  if (!time) return '';
  if (!time.includes(' ')) return time; // Already in 24h format e.g. "14:15"
  const [timePart, ampm] = time.split(' ');
  let [hours, minutes] = timePart.split(':');
  let hoursNum = parseInt(hours, 10);
  if (ampm.toUpperCase() === 'PM' && hoursNum !== 12) hoursNum += 12;
  if (ampm.toUpperCase() === 'AM' && hoursNum === 12) hoursNum = 0;
  return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Helper to convert 24-hour ISO time strings (e.g. "14:45:00" or "14:45") to 12-hour AM/PM format (e.g. "02:45 PM").
 */
export const formatTimeFromBackend = (time: string): string => {
  if (!time) return '';
  if (time.toUpperCase().includes('AM') || time.toUpperCase().includes('PM')) return time; // Already in 12h format
  const parts = time.split(':');
  if (parts.length < 2) return time;
  let hoursNum = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hoursNum >= 12 ? 'PM' : 'AM';
  if (hoursNum > 12) hoursNum -= 12;
  if (hoursNum === 0) hoursNum = 12;
  return `${hoursNum.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

/**
 * Safely converts an ISO date string (YYYY-MM-DD) to local formatted date string.
 */
export const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const localDate = new Date(year, month, day);
      return localDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
  return dateStr;
};

/**
 * Safely converts a UTC ISO timestamp (e.g. "2026-08-27T18:43:00") into local phone date & time format.
 * Appends 'Z' if missing so JavaScript parses it as UTC and converts to local device timezone offset (+5:30).
 */
export const formatDisplayDateTime = (isoString?: string): string => {
  if (!isoString) return '';
  const utcString = (isoString.endsWith('Z') || isoString.includes('+')) 
    ? isoString 
    : `${isoString}Z`;
  const dateObj = new Date(utcString);
  if (isNaN(dateObj.getTime())) return isoString;
  
  return dateObj.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};


