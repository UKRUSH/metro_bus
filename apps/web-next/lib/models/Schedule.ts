import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  routeId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  departureTime: string;
  arrivalTime: string;
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  isActive: boolean;
  availableSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
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
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    days: [
      {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    availableSeats: {
      type: Number,
      default: 40,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ScheduleSchema.index({ routeId: 1, departureTime: 1 });
ScheduleSchema.index({ busId: 1 });
ScheduleSchema.index({ isActive: 1 });

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);
