import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IBus extends Document {
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  yearOfManufacture?: number;
  ownerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceNotes?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  locationGeoJSON?: ILocation; // For geospatial queries
  routeId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  speed?: number; // km/h
  heading?: number; // degrees (0-359)
  lastLocationUpdate?: Date;
  facilities: string[]; // ['wifi', 'ac', 'wheelchair_accessible']
  currentStatus: 'available' | 'in-service' | 'maintenance' | 'retired';
  
  // Extended fields for owner registration
  chassisNumber?: string;
  engineNumber?: string;
  routeNumbers?: string;
  routePermitNumber?: string;
  permitExpiryDate?: Date;
  vehicleType?: string;
  insuranceType?: string;
  insuranceExpiryDate?: Date;
  emissionTestCertificate?: string;
  emissionTestExpiry?: Date;
  revenueLicenseNumber?: string;
  revenueLicenseExpiry?: Date;
  tyreConditionFront?: string;
  tyreConditionRear?: string;
  brakeTestReport?: string;
  firstAidBoxAvailable?: boolean;
  fireExtinguisherAvailable?: boolean;
  cctvAvailable?: boolean;
  gpsTrackerAvailable?: boolean;
  vehicleBookUrl?: string;
  routePermitBookUrl?: string;
  insuranceCertificateUrl?: string;
  revenueLicenseScanUrl?: string;
  fitnessReportUrl?: string;
  status?: string;
  currentDriverId?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
  updateLocation(longitude: number, latitude: number, speed?: number, heading?: number): Promise<IBus>;
}

const BusSchema = new Schema<IBus>(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    busType: {
      type: String,
      required: true,
      enum: ['Standard', 'Luxury', 'Express', 'AC', 'Non-AC', 'Double Decker'],
      default: 'Standard',
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    busModel: {
      type: String,
      trim: true,
    },
    yearOfManufacture: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    maintenanceNotes: {
      type: String,
      trim: true,
    },
    currentLocation: {
      lat: {
        type: Number,
        min: -90,
        max: 90,
      },
      lng: {
        type: Number,
        min: -180,
        max: 180,
      },
    },
    locationGeoJSON: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v: number[]) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates. Format: [longitude, latitude]',
        },
      },
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    speed: {
      type: Number,
      min: 0,
      default: 0,
    },
    heading: {
      type: Number,
      min: 0,
      max: 359,
    },
    lastLocationUpdate: {
      type: Date,
    },
    facilities: {
      type: [String],
      default: [],
    },
    currentStatus: {
      type: String,
      enum: ['available', 'in-service', 'maintenance', 'retired'],
      default: 'available',
      index: true,
    },
    // Extended fields for owner registration
    chassisNumber: {
      type: String,
      trim: true,
    },
    engineNumber: {
      type: String,
      trim: true,
    },
    routeNumbers: {
      type: String,
      trim: true,
    },
    routePermitNumber: {
      type: String,
      trim: true,
    },
    permitExpiryDate: {
      type: Date,
    },
    vehicleType: {
      type: String,
      enum: ['ac', 'non-ac', 'semi-luxury', 'normal'],
    },
    insuranceType: {
      type: String,
      enum: ['third-party', 'comprehensive'],
    },
    insuranceExpiryDate: {
      type: Date,
    },
    emissionTestCertificate: {
      type: String,
      trim: true,
    },
    emissionTestExpiry: {
      type: Date,
    },
    revenueLicenseNumber: {
      type: String,
      trim: true,
    },
    revenueLicenseExpiry: {
      type: Date,
    },
    tyreConditionFront: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs-replacement'],
    },
    tyreConditionRear: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs-replacement'],
    },
    brakeTestReport: {
      type: String,
      trim: true,
    },
    firstAidBoxAvailable: {
      type: Boolean,
      default: false,
    },
    fireExtinguisherAvailable: {
      type: Boolean,
      default: false,
    },
    cctvAvailable: {
      type: Boolean,
      default: false,
    },
    gpsTrackerAvailable: {
      type: Boolean,
      default: false,
    },
    vehicleBookUrl: {
      type: String,
    },
    routePermitBookUrl: {
      type: String,
    },
    insuranceCertificateUrl: {
      type: String,
    },
    revenueLicenseScanUrl: {
      type: String,
    },
    fitnessReportUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'inactive', 'maintenance'],
    },
    currentDriverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
BusSchema.index({ registrationNumber: 1 });
BusSchema.index({ isActive: 1, currentStatus: 1 });
BusSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
BusSchema.index({ locationGeoJSON: '2dsphere' }); // Geospatial index
BusSchema.index({ routeId: 1, currentStatus: 1 });
BusSchema.index({ driverId: 1 });

// Methods
BusSchema.methods.updateLocation = async function (
  longitude: number,
  latitude: number,
  speed?: number,
  heading?: number
) {
  this.currentLocation = { lat: latitude, lng: longitude };
  this.locationGeoJSON = {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
  if (speed !== undefined) this.speed = speed;
  if (heading !== undefined) this.heading = heading;
  this.lastLocationUpdate = new Date();
  return await this.save();
};

// Static methods
BusSchema.statics.findNearby = async function (
  longitude: number,
  latitude: number,
  maxDistance: number = 5000 // meters
) {
  return await this.find({
    locationGeoJSON: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
    currentStatus: 'in-service',
  }).populate('routeId');
};

BusSchema.statics.findByRoute = async function (routeId: string, status?: string) {
  const query: any = { routeId };
  if (status) {
    query.currentStatus = status;
  }
  return await this.find(query).populate('routeId').populate('driverId', 'email profile');
};

export default mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);
