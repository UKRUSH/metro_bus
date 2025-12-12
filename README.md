# Metro Bus System 🚍

A comprehensive online metro bus management system with real-time tracking, booking, and multi-stakeholder management.

## 🏗️ Project Structure

```
metro-bus-system/
├── apps/
│   ├── web-next/          # Next.js passenger-facing web app (SSR)
│   └── admin-vite/        # Vite React admin dashboard (SPA)
├── packages/
│   └── shared/            # Shared types, utilities, and validation
└── package.json           # Monorepo root
```

## 🎯 Stakeholders

1. **Passengers** - Book tickets, buy season passes, track buses, give feedback
2. **Drivers** - Log attendance, trips, bus condition reports
3. **Bus Owners** - Manage fleet, view maintenance and revenue
4. **Admin** - Full system control, manage routes, schedules, users
5. **Finance** - Handle payroll, commissions, revenue tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB (local or Atlas)
- Redis (optional, for caching)

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Run both apps in parallel
pnpm dev

# Or run individually
pnpm dev:web      # Next.js app on http://localhost:3000
pnpm dev:admin    # Admin dashboard on http://localhost:3001
```

### Build

```bash
# Build all apps
pnpm build

# Or build individually
pnpm build:web
pnpm build:admin
```

## 📦 Packages

### @metro/web-next
Passenger-facing Next.js application with:
- Server-side rendering (SSR)
- Booking system
- Real-time bus tracking
- Season pass management
- Profile management

### @metro/admin-vite
Admin dashboard built with Vite + React:
- User management
- Fleet management
- Route & schedule management
- Analytics & reports
- Finance management
- Live tracking map

### @metro/shared
Shared package containing:
- TypeScript types and interfaces
- Zod validation schemas
- Utility functions
- Application constants

## 🛠️ Tech Stack

- **Frontend (Passenger)**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Frontend (Admin)**: Vite, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.IO
- **State Management**: SWR (web), React Query (admin)
- **Charts**: Recharts

## 🗄️ Database Schema

**Core Collections:**
- `users` - All user accounts with roles
- `drivers` - Driver-specific data
- `buses` - Fleet inventory
- `routes` - Route definitions with stops
- `schedules` - Timetables
- `bookings` - Ticket bookings
- `season_passes` - Subscription passes
- `trip_logs` - Driver journey records
- `complaints` - Feedback system
- `reviews` - Ratings
- `maintenance_reports` - Bus maintenance
- `salary_records` - Payroll data

## 📝 Environment Variables

Create `.env.local` files in each app:

### apps/web-next/.env.local
```env
MONGODB_URI=mongodb://localhost:27017/metro_bus
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### apps/admin-vite/.env
```env
VITE_API_URL=http://localhost:3000/api
```

## 🎯 Development Roadmap

- [x] Task 1: Monorepo skeleton setup ✅
- [ ] Task 2: Auth + Roles system
- [ ] Task 3: User registration & login
- [ ] Task 4: Passenger profile
- [ ] Task 5: Season ticket management
- [ ] Task 6: Normal booking flow
- [ ] Task 7: Route & schedule management
- [ ] Task 8: Bus management
- [ ] Task 9: Driver registration
- [ ] Task 10: Driver attendance & trip logs
- [ ] Task 11: Bus condition reports
- [ ] Task 12: Live tracking
- [ ] Task 13: Complaint & feedback
- [ ] Task 14: Review & rating
- [ ] Task 15: Reports & analytics
- [ ] Task 16-30: Advanced features

## 📄 License

Private - All rights reserved

## 👥 Contributors

Development Team
