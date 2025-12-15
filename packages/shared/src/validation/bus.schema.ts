import { z } from 'zod';
import { busStatusSchema, idSchema } from './common.schema';

// Bus type and facilities enums
export const busTypeEnum = z.enum([
  'Standard',
  'Luxury',
  'Express',
  'AC',
  'Non-AC',
  'Double Decker',
]);

export const facilitiesEnum = z.enum([
  'wifi',
  'ac',
  'wheelchair_accessible',
  'usb_charging',
  'gps',
  'cctv',
  'audio_system',
  'emergency_exit',
]);

export const createBusSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3, 'Registration number must be at least 3 characters')
    .max(20, 'Registration number must not exceed 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Registration number must contain only uppercase letters, numbers, and hyphens'),
  capacity: z.number().int().min(10).max(100),
  busType: busTypeEnum,
  manufacturer: z.string().trim().min(1).max(50).optional(),
  busModel: z.string().trim().min(1).max(50).optional(),
  yearOfManufacture: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  ownerId: idSchema.optional(),
  isActive: z.boolean().optional().default(true),
  lastMaintenanceDate: z.string().datetime().or(z.date()).optional(),
  nextMaintenanceDate: z.string().datetime().or(z.date()).optional(),
  maintenanceNotes: z.string().trim().max(500).optional(),
  facilities: z.array(facilitiesEnum).optional().default([]),
  currentStatus: busStatusSchema.optional(),
  // Extended owner registration fields
  chassisNumber: z.string().trim().max(50).optional(),
  engineNumber: z.string().trim().max(50).optional(),
  routeNumbers: z.string().trim().max(100).optional(),
  routePermitNumber: z.string().trim().max(50).optional(),
  permitExpiryDate: z.string().datetime().or(z.date()).optional(),
  vehicleType: z.string().trim().max(50).optional(),
  insuranceType: z.string().trim().max(50).optional(),
  insuranceExpiryDate: z.string().datetime().or(z.date()).optional(),
  emissionTestCertificate: z.string().trim().max(100).optional(),
  emissionTestExpiry: z.string().datetime().or(z.date()).optional(),
  revenueLicenseNumber: z.string().trim().max(50).optional(),
  revenueLicenseExpiry: z.string().datetime().or(z.date()).optional(),
  tyreConditionFront: z.string().trim().max(50).optional(),
  tyreConditionRear: z.string().trim().max(50).optional(),
  brakeTestReport: z.string().trim().max(50).optional(),
  firstAidBoxAvailable: z.boolean().optional(),
  fireExtinguisherAvailable: z.boolean().optional(),
  cctvAvailable: z.boolean().optional(),
  gpsTrackerAvailable: z.boolean().optional(),
});

export const updateBusSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9-]+$/)
    .optional(),
  capacity: z.number().int().min(10).max(100).optional(),
  busType: busTypeEnum.optional(),
  manufacturer: z.string().trim().min(1).max(50).optional(),
  busModel: z.string().trim().min(1).max(50).optional(),
  yearOfManufacture: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  ownerId: idSchema.optional(),
  isActive: z.boolean().optional(),
  lastMaintenanceDate: z.string().datetime().or(z.date()).optional(),
  nextMaintenanceDate: z.string().datetime().or(z.date()).optional(),
  maintenanceNotes: z.string().trim().max(500).optional(),
  facilities: z.array(facilitiesEnum).optional(),
  currentStatus: busStatusSchema.optional(),
  driverId: idSchema.optional().nullable(),
  routeId: idSchema.optional().nullable(),
  // Extended owner registration fields
  chassisNumber: z.string().trim().max(50).optional(),
  engineNumber: z.string().trim().max(50).optional(),
  routeNumbers: z.string().trim().max(100).optional(),
  routePermitNumber: z.string().trim().max(50).optional(),
  permitExpiryDate: z.string().datetime().or(z.date()).optional(),
  vehicleType: z.string().trim().max(50).optional(),
  insuranceType: z.string().trim().max(50).optional(),
  insuranceExpiryDate: z.string().datetime().or(z.date()).optional(),
  emissionTestCertificate: z.string().trim().max(100).optional(),
  emissionTestExpiry: z.string().datetime().or(z.date()).optional(),
  revenueLicenseNumber: z.string().trim().max(50).optional(),
  revenueLicenseExpiry: z.string().datetime().or(z.date()).optional(),
  tyreConditionFront: z.string().trim().max(50).optional(),
  tyreConditionRear: z.string().trim().max(50).optional(),
  brakeTestReport: z.string().trim().max(50).optional(),
  firstAidBoxAvailable: z.boolean().optional(),
  fireExtinguisherAvailable: z.boolean().optional(),
  cctvAvailable: z.boolean().optional(),
  gpsTrackerAvailable: z.boolean().optional(),
});

export const maintenanceReportSchema = z.object({
  busId: idSchema,
  maintenanceType: z.enum(['routine', 'repair', 'inspection']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  issues: z.array(z.string()).optional(),
  cost: z.number().positive().optional(),
  mechanicNotes: z.string().optional(),
});

export const busConditionReportSchema = z.object({
  busId: idSchema,
  checklist: z.object({
    brakes: z.boolean(),
    lights: z.boolean(),
    tires: z.boolean(),
    engine: z.boolean(),
    cleanliness: z.boolean(),
    seats: z.boolean(),
    doors: z.boolean(),
    airConditioning: z.boolean(),
  }),
  issues: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
