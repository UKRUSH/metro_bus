import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Personal Information
  fullName: string;
  nicNumber: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  
  // Address Information
  permanentAddress: string;
  currentAddress?: string;
  
  // Contact Information
  mobileNumber: string;
  email: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  
  // License Information
  licenseNumber: string;
  licenseExpiry: Date;
  licenseType: string;
  licenseIssuedDistrict?: string;
  
  // Document URLs
  licenseFrontImageUrl?: string;
  licenseBackImageUrl?: string;
  profilePhotoUrl?: string;
  medicalCertificateUrl?: string;
  medicalExpiryDate?: Date;
  backgroundCheckUrl?: string;
  
  // Insurance Information
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date;
  insuranceDocumentUrl?: string;
  
  // Document Verification
  documentsVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  
  // Driver Status
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended' | 'on_leave';
  
  // Assignment
  assignedBusId?: mongoose.Types.ObjectId;
  
  // Performance Tracking
  experienceYears: number;
  rating: number;
  totalTrips: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    nicNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    permanentAddress: {
      type: String,
      required: true,
    },
    currentAddress: {
      type: String,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    emergencyContactName: {
      type: String,
    },
    emergencyContactRelation: {
      type: String,
    },
    emergencyContactNumber: {
      type: String,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    licenseType: {
      type: String,
      required: true,
    },
    licenseIssuedDistrict: {
      type: String,
    },
    licenseFrontImageUrl: {
      type: String,
    },
    licenseBackImageUrl: {
      type: String,
    },
    profilePhotoUrl: {
      type: String,
    },
    medicalCertificateUrl: {
      type: String,
    },
    medicalExpiryDate: {
      type: Date,
    },
    backgroundCheckUrl: {
      type: String,
    },
    insuranceProvider: {
      type: String,
    },
    insurancePolicyNumber: {
      type: String,
    },
    insuranceExpiryDate: {
      type: Date,
    },
    insuranceDocumentUrl: {
      type: String,
    },
    documentsVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'inactive', 'suspended', 'on_leave'],
      default: 'pending',
    },
    assignedBusId: {
      type: Schema.Types.ObjectId,
      ref: 'Bus',
      index: true,
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalTrips: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DriverSchema.index({ status: 1 });
DriverSchema.index({ nicNumber: 1 });
DriverSchema.index({ licenseExpiry: 1 });
DriverSchema.index({ medicalExpiryDate: 1 });
DriverSchema.index({ insuranceExpiryDate: 1 });
DriverSchema.index({ documentsVerified: 1 });

export default mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
