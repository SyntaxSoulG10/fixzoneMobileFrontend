/**
 * Parses a time string like "08:00 AM" or "18:00" and converts it to minutes since midnight.
 * Returns null if the string is invalid.
 */
function parseTimeStr(timeStr: string): number | null {
  // Matches both 12-hour format "08:00 AM" and 24-hour format "18:00"
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (period) {
    // 12-hour format logic
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  return hours * 60 + minutes;
}

/**
 * Determines if a business is currently open based on an opening hours string.
 * Example input: "08:00 AM - 05:00 PM"
 * 
 * @param openingHours The opening hours string
 * @param currentDate Optional Date object for testing purposes. Defaults to new Date().
 * @returns true if open, false if closed, null if data is invalid/unavailable.
 */
export function isServiceCenterOpen(openingHours?: string, currentDate: Date = new Date()): boolean | null {
  if (!openingHours || typeof openingHours !== 'string') return null;

  const parts = openingHours.split('-');
  if (parts.length !== 2) return null;

  const startMinutes = parseTimeStr(parts[0]);
  const endMinutes = parseTimeStr(parts[1]);

  if (startMinutes === null || endMinutes === null) return null;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // Closing time is treated as exclusive (e.g., if closes at 5:00 PM, at 5:00 PM it's closed)
  if (startMinutes <= endMinutes) {
    // Normal day (e.g. 8 AM to 5 PM)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight (e.g. 9 PM to 2 AM)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}
