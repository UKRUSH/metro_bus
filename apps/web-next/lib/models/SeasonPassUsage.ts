import mongoose, { Schema, Document } from 'mongoose';

export interface ISeasonPassUsage extends Document {
  seasonPassId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  routeId?: mongoose.Types.ObjectId;
  usedAt: Date;
  scannedBy: mongoose.Types.ObjectId;
  location?: string;
  createdAt: Date;
}

const seasonPassUsageSchema = new Schema<ISeasonPassUsage>(
  {
    seasonPassId: {
      type: Schema.Types.ObjectId,
      ref: 'SeasonPass',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
    },
    usedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound indexes for queries
seasonPassUsageSchema.index({ seasonPassId: 1, usedAt: -1 });
seasonPassUsageSchema.index({ userId: 1, usedAt: -1 });

const SeasonPassUsage = mongoose.models.SeasonPassUsage || 
  mongoose.model<ISeasonPassUsage>('SeasonPassUsage', seasonPassUsageSchema);

export default SeasonPassUsage;
