import { UserRole } from './common.types';

export type UserProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
};

export type User = {
  _id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPassword = User & {
  passwordHash: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type JWTPayload = {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

export type RegisterInput = {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};
