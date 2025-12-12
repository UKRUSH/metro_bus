import mongoose, { Schema, Document } from 'mongoose';

export interface IConditionCheckItem {
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documents';
  item: string;
  status: 'good' | 'needs_attention' | 'critical';
  notes?: string;
}

export interface IConditionReport extends Document {
  driverId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  reportDate: Date;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  
  // Overall condition
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Checklist items
  checklistItems: IConditionCheckItem[];
  
  // Odometer reading
  odometerReading: number;
  
  // Fuel level
  fuelLevel: number; // percentage 0-100
  
  // Images
  images: string[]; // Array of image URLs
  
  // Additional notes
  additionalNotes?: string;
  
  // Issues reported
  issuesReported: boolean;
  issueDescription?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  
  // Maintenance required
  maintenanceRequired: boolean;
  estimatedRepairTime?: string;
  
  // Status
  status: 'submitted' | 'reviewed' | 'action_taken' | 'resolved';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Location
  location?: {
    lat: number;
    lng: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const ConditionReportSchema = new Schema<IConditionReport>(
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
    reportDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    shiftType: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true,
    },
    overallCondition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      required: true,
    },
    checklistItems: [
      {
        category: {
          type: String,
          enum: ['exterior', 'interior', 'mechanical', 'safety', 'documents'],
          required: true,
        },
        item: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['good', 'needs_attention', 'critical'],
          required: true,
        },
        notes: String,
      },
    ],
    odometerReading: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    images: {
      type: [String],
      default: [],
    },
    additionalNotes: {
      type: String,
      trim: true,
    },
    issuesReported: {
      type: Boolean,
      default: false,
      index: true,
    },
    issueDescription: {
      type: String,
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    maintenanceRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    estimatedRepairTime: {
      type: String,
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed', 'action_taken', 'resolved'],
      default: 'submitted',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ConditionReportSchema.index({ driverId: 1, reportDate: -1 });
ConditionReportSchema.index({ busId: 1, reportDate: -1 });
ConditionReportSchema.index({ status: 1, issuesReported: 1 });
ConditionReportSchema.index({ reportDate: -1 });

export default mongoose.models.ConditionReport || 
  mongoose.model<IConditionReport>('ConditionReport', ConditionReportSchema);
