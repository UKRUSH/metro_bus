import { z } from 'zod';
import { bookingStatusSchema, paymentStatusSchema, idSchema } from './common.schema';

export const createBookingSchema = z.object({
  scheduleId: idSchema,
  seatNumber: z.string().min(1, 'Seat number is required'),
  travelDate: z.date().min(new Date(), 'Travel date must be in the future'),
  paymentMethod: z.string().optional(),
});

export const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
});

export const createSeasonPassSchema = z.object({
  routeId: idSchema,
  passType: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.date(),
});

export const searchBookingsSchema = z.object({
  userId: idSchema.optional(),
  status: bookingStatusSchema.optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
