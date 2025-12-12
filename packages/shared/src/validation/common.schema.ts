import { z } from 'zod';
import { UserRole, BookingStatus, BusStatus, DriverStatus, ComplaintStatus, PaymentStatus } from '../types/common.types';

export const userRoleSchema = z.nativeEnum(UserRole);
export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export const busStatusSchema = z.nativeEnum(BusStatus);
export const driverStatusSchema = z.nativeEnum(DriverStatus);
export const complaintStatusSchema = z.nativeEnum(ComplaintStatus);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
