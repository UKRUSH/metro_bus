/**
 * Update routes to have origin and destination based on first and last stops
 * Usage: npx tsx scripts/update-route-endpoints.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import Route from '../lib/models/Route';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI or DATABASE_URL not found in environment variables');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

async function updateRouteEndpoints() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const routes = await Route.find({});
    console.log(`Found ${routes.length} routes`);

    let updated = 0;

    for (const route of routes) {
      // Skip if origin and destination already set
      if (route.origin && route.destination && route.origin !== '' && route.destination !== '') {
        console.log(`Route ${route.name} already has endpoints set`);
        continue;
      }

      // If route has stops, use first and last stop as origin and destination
      if (route.stops && route.stops.length > 0) {
        const sortedStops = route.stops.sort((a: any, b: any) => a.order - b.order);
        route.origin = sortedStops[0].name;
        route.destination = sortedStops[sortedStops.length - 1].name;
        
        await route.save();
        updated++;
        console.log(`Updated ${route.name}: ${route.origin} → ${route.destination}`);
      } else {
        console.log(`Route ${route.name} has no stops, skipping`);
      }
    }

    console.log(`\n✅ Updated ${updated} routes`);
    
  } catch (error) {
    console.error('Error updating routes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

updateRouteEndpoints();
