import { BookingStatus, PaymentStatus } from './common.types';

export type Booking = {
  _id: string;
  userId: string;
  scheduleId: string;
  routeId: string;
  busId: string;
  seatNumber: string;
  bookingDate: Date;
  travelDate: Date;
  status: BookingStatus;
  price: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SeasonPass = {
  _id: string;
  userId: string;
  routeId: string;
  passType: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  price: number;
  status: 'active' | 'expired' | 'cancelled';
  paymentStatus: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BookingInput = {
  scheduleId: string;
  seatNumber: string;
  travelDate: Date;
  paymentMethod?: string;
};

export type SeasonPassInput = {
  routeId: string;
  passType: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
};
