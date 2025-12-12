import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  seatNumber: string;
  bookingDate: Date;
  travelDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    travelDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BookingSchema.index({ userId: 1, travelDate: -1 });
BookingSchema.index({ scheduleId: 1, travelDate: 1, seatNumber: 1 }, { unique: true });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
