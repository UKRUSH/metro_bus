import mongoose, { Schema, Document } from 'mongoose';

export interface ISeasonPass extends Document {
  userId: mongoose.Types.ObjectId;
  passType: 'monthly' | 'quarterly' | 'yearly';
  routeId?: mongoose.Types.ObjectId;
  boardingStop?: string;
  alightingStop?: string;
  startDate: Date;
  endDate: Date;
  price: number;
  status: 'active' | 'expired' | 'suspended';
  usageCount: number;
  maxUsage?: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonPassSchema = new Schema<ISeasonPass>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    passType: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      index: true,
    },
    boardingStop: {
      type: String,
    },
    alightingStop: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'suspended'],
      default: 'active',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsage: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

SeasonPassSchema.index({ userId: 1, status: 1 });
SeasonPassSchema.index({ userId: 1, endDate: 1 });
SeasonPassSchema.index({ status: 1, endDate: 1 });

export default mongoose.models.SeasonPass ||
  mongoose.model<ISeasonPass>('SeasonPass', SeasonPassSchema);
