import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ITripLog extends Document {
  driverId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  scheduleId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  startLocation?: ILocation;
  endLocation?: ILocation;
  mileage?: number;
  passengerCount?: number;
  fuelUsed?: number;
  status: 'started' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TripLogSchema = new Schema<ITripLog>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
      index: true,
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere',
      },
    },
    mileage: {
      type: Number,
      min: 0,
    },
    passengerCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    fuelUsed: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['started', 'in_progress', 'completed', 'cancelled'],
      default: 'started',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TripLogSchema.index({ driverId: 1, startTime: -1 });
TripLogSchema.index({ busId: 1, startTime: -1 });
TripLogSchema.index({ scheduleId: 1 });
TripLogSchema.index({ status: 1, startTime: -1 });

export default mongoose.models.TripLog || mongoose.model<ITripLog>('TripLog', TripLogSchema);
