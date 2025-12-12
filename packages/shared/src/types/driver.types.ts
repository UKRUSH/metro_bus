import { DriverStatus, Location } from './common.types';

export type DriverDocuments = {
  licenseNumber: string;
  licenseExpiry: Date;
  licenseImageUrl?: string;
  medicalCertificateUrl?: string;
  medicalCertificateExpiry?: Date;
  backgroundCheckUrl?: string;
};

export type Driver = {
  _id: string;
  userId: string;
  documents: DriverDocuments;
  status: DriverStatus;
  assignedBusId?: string;
  experienceYears?: number;
  rating?: number;
  totalTrips?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Attendance = {
  _id: string;
  driverId: string;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  notes?: string;
  createdAt: Date;
};

export type TripLog = {
  _id: string;
  driverId: string;
  busId: string;
  scheduleId: string;
  routeId: string;
  startTime: Date;
  endTime?: Date;
  startLocation?: Location;
  endLocation?: Location;
  mileage?: number;
  passengerCount?: number;
  fuelUsed?: number;
  status: 'started' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DriverInput = {
  licenseNumber: string;
  licenseExpiry: Date;
  experienceYears?: number;
};

export type TripLogInput = {
  scheduleId: string;
  busId: string;
  routeId: string;
  startLocation?: Location;
};
