import { Location } from './common.types';

export type Stop = {
  name: string;
  location: Location;
  order: number;
  estimatedDuration?: number; // minutes from previous stop
};

export type Route = {
  _id: string;
  name: string;
  code: string;
  stops: Stop[];
  distance: number; // in kilometers
  estimatedDuration: number; // in minutes
  fare: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Schedule = {
  _id: string;
  routeId: string;
  busId: string;
  driverId?: string;
  departureTime: string; // HH:mm format
  arrivalTime: string; // HH:mm format
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  isActive: boolean;
  availableSeats?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type RouteInput = {
  name: string;
  code: string;
  stops: Stop[];
  distance: number;
  estimatedDuration: number;
  fare: number;
  description?: string;
};

export type ScheduleInput = {
  routeId: string;
  busId: string;
  driverId?: string;
  departureTime: string;
  arrivalTime: string;
  days: string[];
};
