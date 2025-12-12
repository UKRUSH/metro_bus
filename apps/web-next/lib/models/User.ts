import mongoose, { Document, Model, Schema } from 'mongoose';
import { UserRole } from '@metro/shared';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
    dateOfBirth?: Date;
    address?: string;
    emergencyContact?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  refreshTokens: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PASSENGER,
      required: true,
      index: true,
    },
    profile: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, unique: true, index: true },
      avatar: { type: String },
      dateOfBirth: { type: Date },
      address: { type: String },
      emergencyContact: { type: String },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ email: 1, role: 1 });
UserSchema.index({ 'profile.phone': 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete (ret as any).passwordHash;
    delete (ret as any).refreshTokens;
    return ret;
  },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
