# Metro Bus System - Feature Implementation Plan

## Current Status Analysis (December 12, 2025)

### ✅ ALREADY IMPLEMENTED

1. **Trip Logs** - Model & API exist
   - Model: `TripLog.ts` ✅
   - API: `/api/drivers/trips` ✅
   - Status: Backend complete, needs admin UI

2. **Bus Management** - Fully functional
   - Model: `Bus.ts` ✅
   - API: `/api/buses` ✅
   - Admin UI: Needed

3. **Bus Condition Reports** - Complete
   - Model: `ConditionReport.ts` ✅
   - API: `/api/condition-reports` ✅
   - Admin UI: `/admin/reports` ✅ (Just created)

4. **Season Passes** - Complete
   - Model: `SeasonPass.ts` ✅
   - API: `/api/season-passes` ✅
   - Admin UI: `/admin/season-passes` ✅ (Just created)

5. **Bookings** - Complete
   - Model: `Booking.ts` ✅
   - API: `/api/bookings` ✅
   - Admin UI: `/admin/bookings` ✅

6. **Routes** - Complete
   - Model: `Route.ts` ✅
   - API: `/api/routes` ✅
   - Admin UI: `/admin/routes` ✅

7. **Driver Management** - Partial
   - Model: `Driver.ts` ✅ (has medicalCertificateUrl field)
   - API: `/api/drivers` ✅
   - Admin UI: Needed

---

## 🔨 FEATURES TO IMPLEMENT

### PRIORITY 1: HIGH PRIORITY (Core Operations)

#### 1. Driver Daily Trip Logs - Admin UI
**Status**: Backend exists, UI needed
- **What exists**: TripLog model, API endpoints
- **What's needed**: Admin page to view all trip logs
- **Implementation**:
  - Create `/admin/trip-logs/page.tsx`
  - Display driver trips with start/end times, kms, incidents
  - Search by driver, bus, date range
  - Filter by status (started, completed, cancelled)
  - View trip details and incidents

#### 2. Bus Management (Admin/Owner UI)
**Status**: Backend exists, full UI needed
- **What exists**: Bus model, basic API
- **What's needed**: Complete admin interface
- **Implementation**:
  - Create `/admin/buses/page.tsx`
  - CRUD operations for buses
  - Maintenance status tracking
  - Assign route to bus
  - Registration details management
  - Filter by status, route, owner

#### 3. Driver Medical & License Info
**Status**: Model has medicalCertificateUrl, needs expansion
- **What exists**: Driver model with basic fields
- **What's needed**: Document management system
- **Implementation**:
  - Expand Driver model: add insurance expiry, medical expiry
  - Create `/admin/drivers/page.tsx`
  - Upload medical records, license documents
  - Validation warnings for expiring documents
  - Alert system for expiring licenses/medical certs

---

### PRIORITY 2: MEDIUM PRIORITY (Customer Service & Insights)

#### 4. Complaint & Review System
**Status**: Not implemented
- **Implementation**:
  - Create models: `Complaint.ts`, `Review.ts`
  - Create API: `/api/complaints`, `/api/reviews`
  - Create admin UI: `/admin/complaints/page.tsx`
  - Passenger submission form
  - Admin response system
  - Generate complaint reports

#### 5. Reports & Analytics Dashboard
**Status**: Not implemented
- **Implementation**:
  - Create `/admin/analytics/page.tsx`
  - Install recharts: `pnpm add recharts`
  - Booking summaries (daily, weekly, monthly)
  - Revenue charts (line, bar, pie)
  - Bus utilization metrics
  - Low-attendance route alerts
  - Driver performance metrics
  - Season pass statistics

---

### PRIORITY 3: LOWER PRIORITY (Financial & Advanced)

#### 6. Finance Module (Salary & Revenue)
**Status**: Not implemented
- **Implementation**:
  - Create models: `Payment.ts`, `Salary.ts`
  - Create API: `/api/finance/salaries`, `/api/finance/payments`
  - Create admin UI: `/admin/finance/page.tsx`
  - Record driver salaries
  - Record owner payments
  - Revenue tracking
  - Expense management
  - Financial reports

#### 7. Maintenance Reports System
**Status**: Condition reports exist, needs maintenance-specific features
- **Implementation**:
  - Create model: `MaintenanceReport.ts`
  - Create API: `/api/maintenance-reports`
  - Create admin UI: `/admin/maintenance/page.tsx`
  - Post-maintenance condition checks
  - Owner/admin notifications
  - Maintenance scheduling
  - Cost tracking

#### 8. Notifications System
**Status**: Not implemented
- **Implementation**:
  - Create model: `Notification.ts`
  - Create API: `/api/notifications`
  - Install nodemailer: `pnpm add nodemailer`
  - Email notifications for bookings, cancellations
  - In-app notifications
  - Document expiry alerts
  - Maintenance reminders
  - Background job system

---

## 📋 STEP-BY-STEP IMPLEMENTATION ORDER

### Phase 1: Essential Operations (Days 1-3)
1. ✅ Trip Logs Admin UI
2. ✅ Bus Management Admin UI  
3. ✅ Driver Documents Management

### Phase 2: Customer Service (Days 4-5)
4. ✅ Complaint System (Model + API + UI)
5. ✅ Review System (Model + API + UI)

### Phase 3: Analytics (Days 6-7)
6. ✅ Reports & Analytics Dashboard
7. ✅ Charts & Visualizations

### Phase 4: Financial (Days 8-9)
8. ✅ Finance Module Setup
9. ✅ Salary Management
10. ✅ Revenue Tracking

### Phase 5: Advanced Features (Days 10-12)
11. ✅ Maintenance Reports System
12. ✅ Notifications System
13. ✅ Email Integration

---

## 🎯 STARTING NOW - PHASE 1

### Task 1: Trip Logs Admin UI
**File**: `/admin/trip-logs/page.tsx`
**Features**:
- View all driver trips
- Search by driver name, bus registration
- Filter by date range, status
- Display: start time, end time, kilometers, passenger count, fuel used
- View trip incidents/notes
- Export to CSV

### Task 2: Bus Management Admin UI
**File**: `/admin/buses/page.tsx`
**Features**:
- CRUD buses (create, read, update, delete)
- Display: registration, type, capacity, status, assigned route
- Maintenance status indicator
- Assign/reassign routes
- Filter by status, owner, route
- Upload registration documents

### Task 3: Driver Documents Management
**File**: `/admin/drivers/page.tsx`
**Features**:
- List all drivers
- View license info (number, expiry, type)
- View medical certificate (upload, expiry date)
- Upload insurance documents
- Warning badges for expiring documents (< 30 days)
- Document verification status
- Filter by status, expiring documents

---

## 📊 DATABASE SCHEMA CHANGES NEEDED

### Driver Model Expansion
```typescript
// Add to existing Driver model
medicalExpiryDate?: Date;
insuranceExpiryDate?: Date;
insuranceProvider?: string;
insurancePolicyNumber?: string;
insuranceDocumentUrl?: string;
documentsVerified: boolean;
verifiedBy?: mongoose.Types.ObjectId;
verifiedAt?: Date;
```

### New Models Required
1. `Complaint.ts`
2. `Review.ts`
3. `Payment.ts`
4. `Salary.ts`
5. `MaintenanceReport.ts` (different from ConditionReport)
6. `Notification.ts`

---

## 🚀 READY TO START IMPLEMENTATION

Shall I begin with **Phase 1, Task 1: Trip Logs Admin UI**?
