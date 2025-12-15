// Common types used across the application

export enum UserRole {
  PASSENGER = 'passenger',
  DRIVER = 'driver',
  OWNER = 'owner',
  ADMIN = 'admin',
  FINANCE = 'finance',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

export enum BusStatus {
  PENDING = 'pending',
  AVAILABLE = 'available',
  IN_SERVICE = 'in-service',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  REJECTED = 'rejected',
}

export enum DriverStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
}

export enum ComplaintStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export type Location = {
  latitude: number;
  longitude: number;
  address?: string;
};

export type DateRange = {
  start: Date;
  end: Date;
};

export type Pagination = {
  page: number;
  limit: number;
  total?: number;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
