// Formatting utilities

export function formatCurrency(amount: number, currency: string = 'LKR'): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  // Format Sri Lankan phone numbers: +94 XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('94')) {
    return `+94 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatSeatNumber(seatNumber: string): string {
  return seatNumber.toUpperCase();
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
