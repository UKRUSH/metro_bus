import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverScheduleAssignment extends Document {
  driverId: mongoose.Types.ObjectId;
  busId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  scheduleId?: mongoose.Types.ObjectId;
  assignmentDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  requestedBy: 'driver' | 'admin';
  requestedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DriverScheduleAssignmentSchema = new Schema<IDriverScheduleAssignment>(
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
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      index: true,
    },
    assignmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'completed'],
      default: 'pending',
      index: true,
    },
    requestedBy: {
      type: String,
      enum: ['driver', 'admin'],
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
DriverScheduleAssignmentSchema.index({ driverId: 1, assignmentDate: 1 });
DriverScheduleAssignmentSchema.index({ busId: 1, assignmentDate: 1 });
DriverScheduleAssignmentSchema.index({ status: 1, assignmentDate: 1 });

export default mongoose.models.DriverScheduleAssignment || 
  mongoose.model<IDriverScheduleAssignment>('DriverScheduleAssignment', DriverScheduleAssignmentSchema);
