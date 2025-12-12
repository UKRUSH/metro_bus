# MongoDB Setup Required

## Error: Connection Refused
The application cannot connect to MongoDB because the database is not running.

## Quick Fix Options:

### Option 1: MongoDB Atlas (Cloud - Easiest)
1. Create free account: https://www.mongodb.com/cloud/atlas/register
2. Create a new cluster (M0 free tier)
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (for development)
5. Get connection string
6. Update `apps/web-next/.env.local`:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/metro_bus?retryWrites=true&w=majority
   ```

### Option 2: Local MongoDB Installation
1. Download: https://www.mongodb.com/try/download/community
2. Install as Windows Service
3. Start service:
   ```powershell
   net start MongoDB
   ```
4. Keep existing .env.local:
   ```
   MONGODB_URI=mongodb://localhost:27017/metro_bus
   ```

### Option 3: Docker (If you have Docker installed)
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Verify Connection
After starting MongoDB, restart your dev server:
```powershell
# Stop current server (Ctrl+C)
# Then restart:
pnpm run dev
```

## Current Configuration
- MongoDB URI: `mongodb://localhost:27017/metro_bus`
- Required for: User authentication, bookings, routes, schedules
- Connection file: `apps/web-next/packages/shared/lib/mongodb.ts`
