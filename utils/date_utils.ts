export const getDaysSinceService = (dateString: string): number | undefined => {
  if (!dateString || dateString === 'N/A' || dateString.toLowerCase() === 'not available') return undefined;
  let serviceDate: Date;
  
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      serviceDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      return undefined;
    }
  } else {
    serviceDate = new Date(dateString);
  }

  if (isNaN(serviceDate.getTime())) return undefined;

  const today = new Date();
  const diffTime = today.getTime() - serviceDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};
