// Validation utility functions

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Sri Lankan phone number validation
  const phoneRegex = /^(\+94|0)?[7][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function isValidPlateNumber(plate: string): boolean {
  // Sri Lankan plate format: XXX-XXXX or XX-XXXX
  const plateRegex = /^[A-Z]{2,3}-\d{4}$/;
  return plateRegex.test(plate);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
