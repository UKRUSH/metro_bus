// Application-wide constants

export const APP_NAME = 'Metro Bus System';
export const APP_VERSION = '1.0.0';

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Bus constants
export const MIN_SEAT_CAPACITY = 10;
export const MAX_SEAT_CAPACITY = 60;

// Season pass pricing (base prices in LKR)
export const SEASON_PASS_PRICES = {
  monthly: 1000,
  quarterly: 2700,
  yearly: 10000,
} as const;

// API rate limits
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const MAX_REQUESTS_PER_WINDOW = 100;

// Real-time tracking
export const GPS_UPDATE_INTERVAL = 10000; // 10 seconds
export const MAP_DEFAULT_ZOOM = 13;

// Roles hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  passenger: 1,
  driver: 2,
  owner: 3,
  finance: 4,
  admin: 5,
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
