import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  driverId: mongoose.Types.ObjectId;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'on_leave'],
      default: 'present',
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

// Compound indexes
AttendanceSchema.index({ driverId: 1, date: -1 });
AttendanceSchema.index({ date: -1, status: 1 });

// Unique constraint: one attendance record per driver per date
AttendanceSchema.index({ driverId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
