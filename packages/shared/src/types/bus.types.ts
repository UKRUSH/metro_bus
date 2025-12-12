import { BusStatus } from './common.types';

export type Bus = {
  _id: string;
  plateNumber: string;
  capacity: number;
  model: string;
  manufacturer?: string;
  year?: number;
  ownerId: string;
  status: BusStatus;
  lastMaintenance?: Date;
  nextMaintenanceDue?: Date;
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MaintenanceReport = {
  _id: string;
  busId: string;
  reportedBy: string;
  maintenanceType: 'routine' | 'repair' | 'inspection';
  description: string;
  issues?: string[];
  cost?: number;
  startDate: Date;
  completionDate?: Date;
  mechanicNotes?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
};

export type BusConditionReport = {
  _id: string;
  busId: string;
  driverId: string;
  date: Date;
  checklist: {
    brakes: boolean;
    lights: boolean;
    tires: boolean;
    engine: boolean;
    cleanliness: boolean;
    seats: boolean;
    doors: boolean;
    airConditioning: boolean;
  };
  issues?: string[];
  images?: string[];
  notes?: string;
  createdAt: Date;
};

export type BusInput = {
  plateNumber: string;
  capacity: number;
  model: string;
  manufacturer?: string;
  year?: number;
  ownerId: string;
};
