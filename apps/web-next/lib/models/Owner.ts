import mongoose, { Schema, Document } from 'mongoose';

export interface IOwner extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Owner Identification
  ownerType: 'individual' | 'company';
  fullName?: string; // For individual
  companyName?: string; // For company
  nicNumber?: string; // For individual
  brNumber?: string; // Business Registration for company
  
  // Address Information
  permanentAddress: string;
  businessAddress?: string;
  
  // Contact Information
  mobileNumber: string;
  email: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  
  // Document URLs
  ownerPhotoUrl?: string;
  
  // Status
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'suspended';
  
  // Business Information
  totalBuses: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const OwnerSchema = new Schema<IOwner>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ['individual', 'company'],
      required: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    nicNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    brNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    permanentAddress: {
      type: String,
      required: true,
    },
    businessAddress: {
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
    emergencyContactNumber: {
      type: String,
    },
    ownerPhotoUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'inactive', 'suspended'],
      default: 'pending',
    },
    totalBuses: {
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
OwnerSchema.index({ status: 1 });
OwnerSchema.index({ ownerType: 1 });

export default mongoose.models.Owner || mongoose.model<IOwner>('Owner', OwnerSchema);
