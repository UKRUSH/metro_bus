# Auth System Documentation

## Overview
Complete JWT-based authentication system with role-based access control (RBAC) for 5 user roles:
- **Passenger** - Regular users who book tickets
- **Driver** - Bus drivers with operational access
- **Owner** - Bus fleet owners
- **Finance** - Finance officers managing payments
- **Admin** - Full system access

## Features
✅ User registration with validation
✅ Secure login with bcrypt password hashing
✅ JWT access tokens (15 minutes)
✅ JWT refresh tokens (7 days)
✅ Token refresh mechanism
✅ Logout with token revocation
✅ Role-based middleware
✅ MongoDB user model with indexes
✅ Input validation with Zod

## API Endpoints

### Authentication

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "phone": "0771234567",
  "firstName": "John",
  "lastName": "Doe",
  "role": "passenger" // Optional: passenger (default), driver, owner, finance, admin
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "role": "passenger",
      "profile": { ... }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1...",
      "refreshToken": "eyJhbGciOiJIUzI1..."
    }
  }
}
```

#### 2. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

#### 3. Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "..."
  }
}
```

#### 4. Get Current User
```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "role": "passenger",
      "profile": { ... },
      "isVerified": false,
      "isActive": true,
      "lastLogin": "2025-11-30T...",
      "createdAt": "2025-11-30T..."
    }
  }
}
```

#### 5. Logout
```
POST /api/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Management (Admin/Finance Only)

#### 6. Get All Users
```
GET /api/users?page=1&limit=20&role=passenger&search=john
Authorization: Bearer {adminAccessToken}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `role` - Filter by role (optional)
- `search` - Search in email, name, phone (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

## Role-Based Access Control

### Role Hierarchy
```
Admin (5) > Finance (4) > Owner (3) > Driver (2) > Passenger (1)
```

### Middleware Usage

```typescript
import { requireAuth } from '@/lib/auth';
import { UserRole } from '@metro/shared';

export async function GET(request: NextRequest) {
  // Check if user is authenticated and has admin or finance role
  const auth = requireAuth([UserRole.ADMIN, UserRole.FINANCE])(request);
  
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.user ? 403 : 401 }
    );
  }
  
  // auth.user contains JWT payload
  const { userId, email, role } = auth.user;
  
  // Your protected logic here
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens stored in database
- Password hash uses bcrypt with 10 salt rounds
- Passwords never returned in API responses

### Database Indexes
- Email (unique)
- Phone (unique)
- Role
- Active status
- Creation date
- Composite indexes for performance

## Error Responses

### 400 - Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - No valid token"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": "Forbidden - Insufficient permissions"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "error": "User with this email or phone already exists"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "..."
}
```

## MongoDB Schema

### User Model
```typescript
{
  email: string (unique, indexed)
  passwordHash: string
  role: 'passenger' | 'driver' | 'owner' | 'finance' | 'admin'
  profile: {
    firstName: string
    lastName: string
    phone: string (unique, indexed)
    avatar?: string
    dateOfBirth?: Date
    address?: string
    emergencyContact?: string
  }
  isVerified: boolean (default: false)
  isActive: boolean (default: true)
  refreshTokens: string[]
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/metro_bus
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Testing

1. Start MongoDB
2. Start Next.js dev server: `pnpm dev:web`
3. Use the API-TESTS.http file or tools like Postman/Insomnia
4. Register users with different roles
5. Test authentication flows
6. Test role-based access control

## Next Steps (Task 3)
- Build UI pages for registration and login
- Add password reset functionality
- Add email verification
- Create protected route components
