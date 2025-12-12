import mongoose, { Schema, Document } from 'mongoose';

export interface IRoute extends Document {
  name: string;
  code: string;
  origin: string;
  destination: string;
  stops: {
    name: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    order: number;
    estimatedDuration?: number;
  }[];
  distance: number;
  estimatedDuration: number;
  fare: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RouteSchema = new Schema<IRoute>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    origin: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    destination: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    stops: [
      {
        name: { type: String, required: true },
        location: {
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          address: { type: String },
        },
        order: { type: Number, required: true },
        estimatedDuration: { type: Number },
      },
    ],
    distance: {
      type: Number,
      required: true,
    },
    estimatedDuration: {
      type: Number,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search optimization
RouteSchema.index({ code: 1 });
RouteSchema.index({ isActive: 1 });
RouteSchema.index({ 'stops.name': 1 });

export default mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);
