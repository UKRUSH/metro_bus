import { z } from 'zod';
import { locationSchema, idSchema } from './common.schema';

export const stopSchema = z.object({
  name: z.string().min(2, 'Stop name is required'),
  location: locationSchema,
  order: z.number().int().positive(),
  estimatedDuration: z.number().int().positive().optional(),
});

export const createRouteSchema = z.object({
  name: z.string().min(3, 'Route name must be at least 3 characters'),
  code: z.string().min(2, 'Route code is required'),
  origin: z.string().min(2, 'Origin is required'),
  destination: z.string().min(2, 'Destination is required'),
  stops: z.array(stopSchema).min(2, 'Route must have at least 2 stops'),
  distance: z.number().positive(),
  estimatedDuration: z.number().int().positive(),
  fare: z.number().positive(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export const updateRouteSchema = z.object({
  name: z.string().min(3).optional(),
  code: z.string().min(2).optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  stops: z.array(stopSchema).min(2).optional(),
  distance: z.number().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  fare: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  description: z.string().optional(),
});

export const createScheduleSchema = z.object({
  routeId: idSchema,
  busId: idSchema,
  driverId: idSchema.optional(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).min(1),
});

export const updateScheduleSchema = z.object({
  routeId: idSchema.optional(),
  busId: idSchema.optional(),
  driverId: idSchema.optional(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  isActive: z.boolean().optional(),
});
