import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { JWTPayload, UserRole } from '@metro/shared';

export type AuthenticatedRequest = NextRequest & {
  user: JWTPayload;
};

/**
 * Get token from Authorization header
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Authenticate request and return user payload
 */
export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return null;
  }
  
  return verifyAccessToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(user: JWTPayload, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Check if user has minimum role level
 * Uses ROLE_HIERARCHY from constants
 */
export function hasMinimumRole(user: JWTPayload, minimumRole: UserRole): boolean {
  const roleHierarchy = {
    passenger: 1,
    driver: 2,
    owner: 3,
    finance: 4,
    admin: 5,
  };
  
  const userLevel = roleHierarchy[user.role];
  const requiredLevel = roleHierarchy[minimumRole];
  
  return userLevel >= requiredLevel;
}

/**
 * Middleware factory for role-based access control
 */
export function requireAuth(allowedRoles?: UserRole[]) {
  return (request: NextRequest): { authorized: boolean; user: JWTPayload | null; error?: string } => {
    const user = authenticateRequest(request);
    
    if (!user) {
      return { authorized: false, user: null, error: 'Unauthorized - No valid token' };
    }
    
    if (allowedRoles && !hasRole(user, allowedRoles)) {
      return { authorized: false, user, error: 'Forbidden - Insufficient permissions' };
    }
    
    return { authorized: true, user };
  };
}
