import { z } from 'zod';
import { driverStatusSchema, locationSchema, idSchema } from './common.schema';

export const createDriverSchema = z.object({
  licenseNumber: z.string().min(5, 'License number is required'),
  licenseExpiry: z.date().min(new Date(), 'License must not be expired'),
  experienceYears: z.number().int().min(0).optional(),
});

export const updateDriverSchema = z.object({
  status: driverStatusSchema.optional(),
  assignedBusId: idSchema.optional(),
  experienceYears: z.number().int().min(0).optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum(['license', 'medical', 'background']),
  url: z.string().url('Invalid URL'),
  expiryDate: z.date().optional(),
});

export const checkInSchema = z.object({
  driverId: idSchema,
  notes: z.string().optional(),
});

export const createTripLogSchema = z.object({
  scheduleId: idSchema,
  busId: idSchema,
  routeId: idSchema,
  startLocation: locationSchema.optional(),
});

export const updateTripLogSchema = z.object({
  endLocation: locationSchema.optional(),
  mileage: z.number().positive().optional(),
  passengerCount: z.number().int().min(0).optional(),
  fuelUsed: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const endTripSchema = z.object({
  endLocation: locationSchema.optional(),
  mileage: z.number().positive(),
  passengerCount: z.number().int().min(0),
  fuelUsed: z.number().positive().optional(),
  notes: z.string().optional(),
});
