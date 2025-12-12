# Task 8 Complete: Route & Schedule Management

## ✅ Implementation Summary

Task 8 has been successfully completed. Admin CRUD operations for routes, stops, and schedules have been implemented with proper validation, authorization, and seed data.

## 🎯 Features Implemented

### 1. Routes Management
- **Create Route** (POST /api/routes)
  - Admin/Owner access only
  - Validates route data (name, code, stops, distance, fare)
  - Checks for duplicate route codes
  - Auto-sorts stops by order
  
- **Update Route** (PUT /api/routes/:id)
  - Admin/Owner access only
  - Validates updates
  - Prevents duplicate codes
  - Maintains stop ordering
  
- **Delete Route** (DELETE /api/routes/:id)
  - Admin access only
  - Soft delete (sets isActive = false)
  - Prevents deletion if active schedules exist
  
- **Get Route** (GET /api/routes/:id)
  - Public access
  - Includes all schedules for the route
  - Populates bus and driver details
  
- **Search Routes** (GET /api/routes)
  - Public access
  - Filter by origin/destination
  - Filter by date (returns schedules for that day)
  - Filter by active status

### 2. Schedules Management
- **Create Schedule** (POST /api/routes/:id/schedules)
  - Admin/Owner access only
  - Validates schedule data
  - Checks for bus/route existence
  - Prevents scheduling conflicts (same bus, overlapping times, same days)
  - Auto-sets available seats from bus capacity
  
- **Update Schedule** (PUT /api/schedules/:id)
  - Admin/Owner access only
  - Validates updates
  - Checks for conflicts with new bus/time
  - Maintains data integrity
  
- **Delete Schedule** (DELETE /api/schedules/:id)
  - Admin access only
  - Soft delete (sets isActive = false)
  - Prevents deletion if active future bookings exist
  
- **Get Schedule** (GET /api/schedules/:id)
  - Public access
  - Full details with populated route, bus, and driver
  
- **Get Route Schedules** (GET /api/routes/:id/schedules)
  - Public access
  - Filter by date (includes booked seats)
  - Shows available seats in real-time

### 3. Data Models

#### Route Model
```typescript
{
  name: string;
  code: string (unique, uppercase);
  stops: [{
    name: string;
    location: { latitude, longitude, address };
    order: number;
    estimatedDuration?: number;
  }];
  distance: number;
  estimatedDuration: number;
  fare: number;
  isActive: boolean;
  description?: string;
}
```

#### Schedule Model
```typescript
{
  routeId: ObjectId (ref Route);
  busId: ObjectId (ref Bus);
  driverId?: ObjectId (ref User);
  departureTime: string (HH:mm);
  arrivalTime: string (HH:mm);
  days: ['monday', 'tuesday', ...];
  isActive: boolean;
  availableSeats: number;
}
```

### 4. Validation Schemas
- `createRouteSchema` - Validates new route creation
- `updateRouteSchema` - Validates route updates
- `createScheduleSchema` - Validates new schedule creation
- `updateScheduleSchema` - Validates schedule updates

All schemas include:
- Required field validation
- Format validation (time, location)
- Data type validation
- Business rule validation

### 5. Seed Data
Created `scripts/seed-routes.ts` with:
- **5 sample routes** covering major Sri Lankan routes:
  - Colombo Fort - Galle Face (city route)
  - Colombo - Kandy Express (intercity)
  - Colombo - Negombo Coastal
  - Kandy - Nuwara Eliya Hill Route
  - Galle - Matara Coastal
  
- **20 schedules** (4 per route):
  - Morning (06:00) - weekdays only
  - Mid-morning (09:00) - weekdays only
  - Afternoon (14:00) - all days
  - Evening (18:00) - all days

**Usage:**
```bash
pnpm seed:routes              # Seed for dev environment
pnpm seed:routes --env=test   # Seed for test environment
pnpm seed:routes --env=prod   # Seed for production
```

## 📁 Files Created/Modified

### New Files
1. `/apps/web-next/app/api/schedules/[id]/route.ts` - Schedule CRUD by ID
2. `/apps/web-next/scripts/seed-routes.ts` - Seed script for routes & schedules

### Modified Files
1. `/apps/web-next/app/api/routes/route.ts` - Added POST (create route)
2. `/apps/web-next/app/api/routes/[id]/route.ts` - Added PUT, DELETE
3. `/apps/web-next/app/api/routes/[id]/schedules/route.ts` - Added POST
4. `/apps/web-next/package.json` - Added seed:routes script

### Existing Files (Already Present)
- `/apps/web-next/lib/models/Route.ts` - Route model with indexes
- `/apps/web-next/lib/models/Schedule.ts` - Schedule model with indexes
- `/packages/shared/src/validation/route.schema.ts` - Validation schemas

## 🔒 Security & Authorization

### Role-Based Access Control
- **Public** (no auth required):
  - GET /api/routes
  - GET /api/routes/:id
  - GET /api/routes/:id/schedules
  - GET /api/schedules/:id
  
- **Admin/Owner** (requires auth + role):
  - POST /api/routes
  - PUT /api/routes/:id
  - POST /api/routes/:id/schedules
  - PUT /api/schedules/:id
  
- **Admin Only** (requires auth + admin role):
  - DELETE /api/routes/:id
  - DELETE /api/schedules/:id

### Validation
- All input validated with Zod schemas
- Business rules enforced (duplicate codes, conflicts, dependencies)
- Data integrity checks before deletion

## 🚀 API Usage Examples

### Create a Route
```http
POST /api/routes
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Colombo - Kandy Express",
  "code": "COL-KDY-X1",
  "stops": [
    {
      "name": "Colombo Fort",
      "location": { "latitude": 6.9344, "longitude": 79.8428 },
      "order": 1
    },
    {
      "name": "Kandy Clock Tower",
      "location": { "latitude": 7.2906, "longitude": 80.6337 },
      "order": 2,
      "estimatedDuration": 135
    }
  ],
  "distance": 115,
  "estimatedDuration": 135,
  "fare": 250,
  "description": "Express route"
}
```

### Create a Schedule
```http
POST /api/routes/{routeId}/schedules
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "busId": "6748a1b2c3d4e5f6a7b8c9d0",
  "driverId": "6748a1b2c3d4e5f6a7b8c9d1",
  "departureTime": "06:00",
  "arrivalTime": "08:15",
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
}
```

### Search Routes
```http
GET /api/routes?origin=Colombo&destination=Kandy&date=2025-12-01
```

### Get Route with Schedules
```http
GET /api/routes/{routeId}
```

### Update Schedule
```http
PUT /api/schedules/{scheduleId}
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "departureTime": "07:00",
  "arrivalTime": "09:15",
  "isActive": true
}
```

## ⚡ Performance Features

### Indexes
- Route: `code`, `isActive`, `stops.name` (for search)
- Schedule: `routeId + departureTime`, `busId`, `isActive`

### Optimizations
- Lean queries for list operations
- Population only when needed
- Conflict checking with targeted queries
- Soft deletes for data preservation

## 🧪 Testing Recommendations

### Unit Tests
- Route validation (duplicate codes, stop ordering)
- Schedule validation (time format, conflict detection)
- Authorization checks for each role

### Integration Tests
- Create → Read → Update → Delete flows
- Conflict detection (overlapping schedules)
- Cascade checks (prevent deletion with dependencies)
- Seed script idempotency

### E2E Tests (Future)
- Admin dashboard: create/edit routes
- Admin dashboard: manage schedules
- Passenger view: search routes and view schedules

## 🔄 Next Steps

### Frontend (Admin Dashboard)
- Create admin UI for routes management
- Create admin UI for schedules management
- Implement route search interface
- Add schedule calendar view

### Enhancements
- Bulk schedule creation (multiple days/times at once)
- Schedule templates (copy from existing)
- Route duplication feature
- Advanced conflict detection (maintenance windows, driver availability)
- Export routes/schedules to CSV

### Integration
- Connect with bus tracking (show buses currently on route)
- Link with bookings (seat availability updates)
- Driver assignment notifications
- Season pass validation for routes

## 📊 Database Schema Diagram

```
Route
  ├── _id
  ├── code (unique)
  ├── name
  ├── stops[]
  │   ├── name
  │   ├── location (lat/lng)
  │   ├── order
  │   └── estimatedDuration
  ├── distance
  ├── estimatedDuration
  ├── fare
  └── isActive

Schedule
  ├── _id
  ├── routeId → Route._id
  ├── busId → Bus._id
  ├── driverId → User._id
  ├── departureTime
  ├── arrivalTime
  ├── days[]
  ├── isActive
  └── availableSeats
```

## ✨ Key Features

1. **Conflict Prevention**: Schedules cannot overlap for the same bus
2. **Data Integrity**: Routes with active schedules cannot be deleted
3. **Smart Seeding**: Environment-aware seed script with idempotency
4. **Real-time Availability**: Seat counts updated based on bookings
5. **Flexible Search**: Multi-criteria route search
6. **Role-based Security**: Proper authorization for admin operations

---

**Status**: ✅ COMPLETE
**Date**: November 30, 2025
**Next Task**: Task 9 - Bus Management (Owner/Admin)
