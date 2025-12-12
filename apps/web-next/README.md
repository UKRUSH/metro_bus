# Metro Bus Web App (Next.js)

Passenger-facing web application built with Next.js 15, React 19, and TypeScript.

## Features

- 🎟️ Ticket booking system
- 🎫 Season pass management
- 🗺️ Real-time bus tracking
- 👤 User profile management
- ⭐ Review and rating system
- 💬 Complaint submission
- 📱 Responsive design

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- SWR for data fetching
- Socket.IO for real-time features
- Mongoose for MongoDB

## Getting Started

### Development

```bash
pnpm dev
```

Runs on http://localhost:3000

### Build

```bash
pnpm build
pnpm start
```

### Type Checking

```bash
pnpm typecheck
```

## Project Structure

```
apps/web-next/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── (auth)/         # Auth routes
│   ├── dashboard/      # User dashboard
│   ├── booking/        # Booking flow
│   └── api/            # API routes
├── components/         # React components
├── lib/               # Utilities and helpers
├── public/            # Static assets
└── types/             # TypeScript types
```

## Environment Variables

Create `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/metro_bus
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
