import mongoose, { Schema, Document } from 'mongoose';

export interface IBusLocation extends Document {
  busId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  heading?: number; // Direction in degrees (0-360)
  speed?: number; // km/h
  accuracy?: number; // meters
  altitude?: number; // meters
  timestamp: Date;
  routeId?: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  status: 'moving' | 'stopped' | 'idle' | 'offline';
  passengers?: number; // Current passenger count
  nextStopETA?: Date;
  batteryLevel?: number; // GPS device battery %
}

const BusLocationSchema = new Schema<IBusLocation>(
  {
    busId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // latitude
            );
          },
          message: 'Invalid coordinates',
        },
      },
    },
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    speed: {
      type: Number,
      min: 0,
      default: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
    },
    altitude: {
      type: Number,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'TripLog',
    },
    status: {
      type: String,
      enum: ['moving', 'stopped', 'idle', 'offline'],
      default: 'idle',
      index: true,
    },
    passengers: {
      type: Number,
      min: 0,
      default: 0,
    },
    nextStopETA: {
      type: Date,
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
BusLocationSchema.index({ location: '2dsphere' });

// Compound indexes for efficient queries
BusLocationSchema.index({ busId: 1, timestamp: -1 });
BusLocationSchema.index({ routeId: 1, status: 1 });
BusLocationSchema.index({ status: 1, timestamp: -1 });

// TTL index - automatically delete old location data after 7 days
BusLocationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

// Static method to get latest location for a bus
BusLocationSchema.statics.getLatestLocation = function (busId: string) {
  return this.findOne({ busId })
    .sort({ timestamp: -1 })
    .populate('busId', 'registrationNumber busType')
    .populate('driverId', 'fullName mobileNumber');
};

// Static method to get all active buses
BusLocationSchema.statics.getAllActiveBuses = function () {
  return this.aggregate([
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: '$busId',
        latestLocation: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: { newRoot: '$latestLocation' },
    },
    {
      $match: {
        status: { $ne: 'offline' },
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      },
    },
  ]);
};

// Static method to find nearby buses
BusLocationSchema.statics.findNearby = function (
  longitude: number,
  latitude: number,
  maxDistance: number = 5000 // meters
) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance,
        spherical: true,
      },
    },
    {
      $match: {
        status: { $ne: 'offline' },
        timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    },
    {
      $sort: { distance: 1 },
    },
  ]);
};

export default mongoose.models.BusLocation ||
  mongoose.model<IBusLocation>('BusLocation', BusLocationSchema);
