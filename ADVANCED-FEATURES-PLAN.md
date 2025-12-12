# Metro Bus System - Advanced Features Implementation Plan

## Date: December 12, 2025

---

## 📊 FEATURE ANALYSIS & PRIORITIZATION

### PRIORITY 1: CORE USER FEATURES (Days 1-4)
Essential features that directly impact user experience and bookings.

#### 1. 🔍 Search & Filters System
**Status**: Partially exists, needs enhancement
**Stakeholder**: Passengers
**Implementation**:
- Frontend: Enhanced search component with filters
- Backend: Optimized search API endpoints
- Features:
  - Search routes by origin/destination
  - Filter by departure time (morning, afternoon, evening)
  - Filter by price range
  - Filter by seat availability
  - Filter by bus type (AC, Non-AC, Luxury)
  - Sort by price, time, duration
- Files needed:
  - `app/search/page.tsx` - Enhanced search UI
  - `app/api/search/routes/route.ts` - Search API
  - `components/SearchFilters.tsx` - Reusable filters
  - `components/SearchResults.tsx` - Results display

#### 2. 💺 Seat Selection & Real-time Availability
**Status**: Not implemented
**Stakeholder**: Passengers, Drivers
**Implementation**:
- Visual seat map (grid layout)
- Real-time availability check
- Temporary seat locking during checkout (5-10 minutes)
- Database locking mechanism
- WebSocket for real-time updates (optional)
- Files needed:
  - `app/booking/[scheduleId]/seats/page.tsx` - Seat selection UI
  - `components/SeatMap.tsx` - Visual seat grid
  - `app/api/seats/lock/route.ts` - Lock seats API
  - `app/api/seats/availability/route.ts` - Check availability
  - `lib/models/SeatLock.ts` - Temporary lock model

**Technical Approach**:
```typescript
// Optimistic locking strategy
interface SeatLock {
  scheduleId: ObjectId;
  seatNumbers: number[];
  userId: ObjectId;
  lockedAt: Date;
  expiresAt: Date; // lockedAt + 10 minutes
  status: 'locked' | 'confirmed' | 'expired';
}

// Cleanup job to release expired locks
setInterval(() => {
  SeatLock.deleteMany({ 
    expiresAt: { $lt: new Date() },
    status: 'locked'
  });
}, 60000); // Every minute
```

#### 3. 📄 Reports Export & PDF Receipts
**Status**: Not implemented
**Stakeholder**: Passengers, Admin, Finance
**Implementation**:
- PDF receipts for bookings (Puppeteer or PDFKit)
- Export booking lists to CSV/Excel
- Income statements export
- Files needed:
  - `app/api/bookings/[id]/receipt/route.ts` - Generate PDF
  - `app/api/reports/export/route.ts` - Export data
  - `lib/pdf/receiptTemplate.ts` - PDF template
  - `lib/pdf/reportTemplate.ts` - Report template

**Dependencies**: 
```bash
pnpm add @react-pdf/renderer pdfkit puppeteer-core
```

---

### PRIORITY 2: ADMIN & OPERATIONS (Days 5-7)

#### 4. 👥 Admin User Management
**Status**: Partial - needs enhancement
**Stakeholder**: Admin
**Implementation**:
- Manage user roles (ADMIN, OWNER, DRIVER, PASSENGER)
- Enable/disable user accounts
- Audit log for admin actions
- View user activity
- Files needed:
  - `app/admin/users/page.tsx` - User management UI
  - `lib/models/AuditLog.ts` - Audit trail model
  - `app/api/admin/users/route.ts` - User management API
  - `app/api/admin/audit/route.ts` - Audit log API

#### 5. 🚗 Driver Onboarding Flow
**Status**: Registration exists, needs workflow
**Stakeholder**: Drivers, Admin
**Implementation**:
- Multi-step onboarding form
- Document upload checklist:
  - License (front & back)
  - Medical certificate
  - Police clearance
  - Profile photo
- Admin approval workflow
- Status tracking (pending → documents_submitted → verified → approved → active)
- Email notifications at each step
- Files needed:
  - `app/driver/onboarding/page.tsx` - Driver onboarding UI
  - `app/admin/drivers/page.tsx` - Admin approval UI
  - `app/api/drivers/onboarding/route.ts` - Onboarding API
  - `components/DocumentUpload.tsx` - Upload component

---

### PRIORITY 3: QUALITY & DEPLOYMENT (Days 8-10)

#### 6. 🧪 Testing & QA
**Status**: Not implemented
**Stakeholder**: Dev team
**Implementation**:
- Unit tests for API routes
- Component tests for UI
- E2E tests for critical flows
- Files needed:
  - `__tests__/api/bookings.test.ts`
  - `__tests__/components/SeatMap.test.tsx`
  - `e2e/booking-flow.spec.ts`
  - `jest.config.js`
  - `playwright.config.ts`

**Dependencies**:
```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test
pnpm add -D ts-jest @types/jest
```

#### 7. 🔄 CI/CD Pipeline
**Status**: Not implemented
**Stakeholder**: Dev team
**Implementation**:
- GitHub Actions workflow
- Automated testing on push
- Type checking
- Linting & formatting
- Build verification
- Automated deployment to Vercel
- Files needed:
  - `.github/workflows/ci.yml` - Main CI workflow
  - `.github/workflows/deploy.yml` - Deployment
  - `.eslintrc.json` - ESLint config
  - `.prettierrc` - Prettier config
  - `.husky/pre-commit` - Pre-commit hooks

#### 8. 🚀 Deployment & Environment
**Status**: Partial - needs optimization
**Stakeholder**: All
**Implementation**:
- Docker containerization
- Environment variables management
- Production configuration
- MongoDB Atlas backup strategy
- Files needed:
  - `Dockerfile` - Next.js container
  - `docker-compose.yml` - Multi-service setup
  - `.env.example` - Environment template
  - `deployment.md` - Deployment guide

---

### PRIORITY 4: POLISH & EXTRAS (Days 11-12)

#### 9. 📚 Documentation
**Status**: Basic README exists
**Stakeholder**: Dev team, reviewers
**Implementation**:
- Swagger/OpenAPI for API documentation
- Comprehensive README
- Contributing guidelines
- API documentation
- Files needed:
  - `app/api/docs/route.ts` - Swagger UI
  - `openapi.yaml` - API specification
  - `CONTRIBUTING.md` - Contribution guide
  - `API.md` - API documentation

#### 10. 🌐 Accessibility & Localization
**Status**: Not implemented
**Stakeholder**: All users
**Implementation**:
- ARIA labels for accessibility
- Keyboard navigation
- i18n setup (Sinhala, English)
- Language toggle
- Voice prompts for English practice
- Files needed:
  - `locales/en/common.json` - English translations
  - `locales/si/common.json` - Sinhala translations
  - `lib/i18n.ts` - i18n configuration
  - `components/LanguageToggle.tsx` - Language switcher

**Dependencies**:
```bash
pnpm add next-i18next react-i18next
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: Core Features
**Day 1-2**: Search & Filters
- Enhanced search page
- Filter components
- Search API optimization

**Day 3-4**: Seat Selection
- Seat map component
- Lock mechanism
- Real-time availability

**Day 5**: PDF Receipts
- PDF generation setup
- Receipt template
- Export functionality

### Week 2: Admin & Quality
**Day 6**: Admin User Management
- User management UI
- Audit logging

**Day 7**: Driver Onboarding
- Onboarding flow
- Document upload
- Approval workflow

**Day 8-9**: Testing
- Unit tests
- E2E tests
- Test coverage

**Day 10**: CI/CD
- GitHub Actions
- Linting setup
- Deployment automation

### Week 3: Polish
**Day 11**: Documentation
- API docs
- README update
- Swagger setup

**Day 12**: i18n & Accessibility
- Language support
- Accessibility improvements
- Voice features

---

## 📦 DEPENDENCIES TO INSTALL

```bash
# PDF Generation
pnpm add @react-pdf/renderer pdfkit
pnpm add -D @types/pdfkit

# Testing
pnpm add -D jest @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test ts-jest @types/jest

# i18n
pnpm add next-i18next react-i18next

# Linting & Formatting
pnpm add -D eslint-config-prettier prettier
pnpm add -D husky lint-staged

# WebSocket (optional for real-time)
pnpm add socket.io socket.io-client

# Excel export
pnpm add xlsx
pnpm add -D @types/xlsx
```

---

## 🗄️ NEW DATABASE MODELS NEEDED

### 1. SeatLock Model
```typescript
interface SeatLock {
  scheduleId: ObjectId;
  seatNumbers: number[];
  userId: ObjectId;
  lockedAt: Date;
  expiresAt: Date;
  status: 'locked' | 'confirmed' | 'expired';
}
```

### 2. AuditLog Model
```typescript
interface AuditLog {
  userId: ObjectId;
  action: string; // 'user.disable', 'user.enable', 'role.change'
  targetUserId?: ObjectId;
  targetResourceId?: ObjectId;
  resourceType?: string; // 'user', 'booking', 'driver'
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
```

### 3. DriverOnboarding Model
```typescript
interface DriverOnboarding {
  userId: ObjectId;
  status: 'pending' | 'documents_submitted' | 'under_review' | 'approved' | 'rejected';
  documents: {
    licenseFront: { uploaded: boolean; url?: string; verified: boolean; };
    licenseBack: { uploaded: boolean; url?: string; verified: boolean; };
    medicalCertificate: { uploaded: boolean; url?: string; verified: boolean; };
    policeClearance: { uploaded: boolean; url?: string; verified: boolean; };
    profilePhoto: { uploaded: boolean; url?: string; verified: boolean; };
  };
  adminNotes?: string;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 STARTING IMPLEMENTATION NOW

### Phase 1: Search & Filters (Starting Now)
Creating enhanced search page with comprehensive filters...
