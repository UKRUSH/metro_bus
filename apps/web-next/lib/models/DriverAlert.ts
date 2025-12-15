import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverAlert extends Document {
  driverId: mongoose.Types.ObjectId;
  alertType: 'drowsiness_warning' | 'drowsiness_critical' | 'sleeping_detected' | 'tension_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  eyeClosedDuration?: number; // in seconds
  moodState?: 'active' | 'tension' | 'sleeping';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  tripId?: mongoose.Types.ObjectId;
  busId?: mongoose.Types.ObjectId;
  routeId?: mongoose.Types.ObjectId;
  resolved: boolean;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverAlertSchema = new Schema<IDriverAlert>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      enum: ['drowsiness_warning', 'drowsiness_critical', 'sleeping_detected', 'tension_detected'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      default: 'medium',
    },
    eyeClosedDuration: {
      type: Number,
      min: 0,
    },
    moodState: {
      type: String,
      enum: ['active', 'tension', 'sleeping'],
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'TripLog',
      index: true,
    },
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      index: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
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

// Compound indexes for efficient queries
DriverAlertSchema.index({ driverId: 1, timestamp: -1 });
DriverAlertSchema.index({ alertType: 1, timestamp: -1 });
DriverAlertSchema.index({ severity: 1, resolved: 1 });
DriverAlertSchema.index({ tripId: 1, timestamp: -1 });

// Index for finding unresolved critical alerts
DriverAlertSchema.index({ resolved: 1, severity: 1, timestamp: -1 });

export default mongoose.models.DriverAlert || mongoose.model<IDriverAlert>('DriverAlert', DriverAlertSchema);
