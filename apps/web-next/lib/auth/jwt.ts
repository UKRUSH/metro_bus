import jwt from 'jsonwebtoken';
import { JWTPayload } from '@metro/shared';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '@metro/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_in_production';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️  WARNING: Using default JWT secrets. Set JWT_SECRET and JWT_REFRESH_SECRET in production!');
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate both tokens at once
 */
export function generateTokens(payload: JWTPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
