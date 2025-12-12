// GPS Location Simulator for Testing Real-time Tracking
// This script generates simulated GPS data for buses

// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../apps/web-next/.env.local') });

// Verify MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

import mongoose from 'mongoose';
import dbConnect from '../apps/web-next/lib/mongodb.js';
import Bus from '../apps/web-next/lib/models/Bus.js';
import Driver from '../apps/web-next/lib/models/Driver.js';
import Route from '../apps/web-next/lib/models/Route.js';
import BusLocation from '../apps/web-next/lib/models/BusLocation.js';

// Colombo, Sri Lanka - Common routes
const COLOMBO_ROUTES: Array<{
  name: string;
  waypoints: [number, number][];
}> = [
  {
    name: 'Colombo - Galle Road',
    waypoints: [
      [79.8612, 6.9271], // Colombo Fort
      [79.8590, 6.9200], // Slave Island
      [79.8570, 6.9000], // Kollupitiya
      [79.8550, 6.8800], // Bambalapitiya
      [79.8530, 6.8600], // Wellawatte
      [79.8510, 6.8400], // Dehiwala
      [79.8490, 6.8200], // Mount Lavinia
    ],
  },
  {
    name: 'Colombo - Kandy Road',
    waypoints: [
      [79.8612, 6.9271], // Colombo Fort
      [79.8650, 6.9350], // Pettah
      [79.8700, 6.9450], // Maradana
      [79.8800, 6.9600], // Borella
      [79.8900, 6.9800], // Rajagiriya
      [79.9000, 7.0000], // Battaramulla
      [79.9100, 7.0200], // Kottawa
    ],
  },
  {
    name: 'Colombo - Negombo Road',
    waypoints: [
      [79.8612, 6.9271], // Colombo Fort
      [79.8700, 6.9400], // Grandpass
      [79.8800, 6.9600], // Peliyagoda
      [79.8900, 6.9800], // Wattala
      [79.9000, 7.0000], // Ja-Ela
      [79.9100, 7.0300], // Katunayake
      [79.9200, 7.0600], // Negombo
    ],
  },
];

interface SimulatedBus {
  busId: string;
  driverId?: string;
  routeId?: string;
  currentWaypointIndex: number;
  direction: 1 | -1; // 1 forward, -1 backward
  progress: number; // 0-1 between waypoints
  speed: number;
  passengers: number;
  waypoints: [number, number][];
}

const activeBuses: Map<string, SimulatedBus> = new Map();

// Calculate bearing between two points
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

// Interpolate between two waypoints
function interpolate(
  point1: [number, number],
  point2: [number, number],
  progress: number
): [number, number] {
  const lng = point1[0] + (point2[0] - point1[0]) * progress;
  const lat = point1[1] + (point2[1] - point1[1]) * progress;
  return [lng, lat];
}

// Initialize simulated buses
async function initializeSimulation() {
  console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
  await dbConnect();

  console.log('🚌 Initializing GPS simulation...');

  // Get all buses (prefer active ones)
  let buses = await Bus.find({ isActive: true, currentStatus: 'in-service' }).limit(10);
  
  // If no active buses, get any buses
  if (buses.length === 0) {
    buses = await Bus.find({}).limit(10);
  }
  
  const drivers = await Driver.find({ status: 'active' }).limit(10);
  const routes = await Route.find({}).limit(3);

  if (buses.length === 0) {
    console.log('❌ No buses found in database. Please add buses first.');
    console.log('   You can add buses via: http://localhost:3000/admin/buses');
    return false;
  }

  console.log(`✅ Found ${buses.length} buses, ${drivers.length} drivers, ${routes.length} routes`);

  // Assign buses to routes with starting positions
  buses.forEach((bus, index) => {
    const routeData = COLOMBO_ROUTES[index % COLOMBO_ROUTES.length];
    const driver = drivers[index % drivers.length];
    const route = routes[index % routes.length];

    activeBuses.set(bus._id.toString(), {
      busId: bus._id.toString(),
      driverId: driver?._id.toString(),
      routeId: route?._id.toString(),
      currentWaypointIndex: 0,
      direction: 1,
      progress: 0,
      speed: 30 + Math.random() * 40, // 30-70 km/h
      passengers: Math.floor(Math.random() * bus.capacity),
      waypoints: routeData.waypoints,
    });
  });

  console.log(`✅ Initialized ${activeBuses.size} simulated buses`);
  return true;
}

// Update bus position
async function updateBusPositions() {
  for (const [busId, busData] of activeBuses.entries()) {
    try {
      const { waypoints, currentWaypointIndex, direction, progress, speed } = busData;

      // Calculate new progress (speed affects how fast we move between waypoints)
      const speedFactor = speed / 100; // Normalize speed
      let newProgress = progress + speedFactor * 0.01; // Move 1% per update adjusted by speed

      let newWaypointIndex = currentWaypointIndex;
      let newDirection = direction;

      // Check if we reached the next waypoint
      if (newProgress >= 1) {
        newProgress = 0;
        newWaypointIndex += direction;

        // Reverse direction at route ends
        if (newWaypointIndex >= waypoints.length - 1) {
          newWaypointIndex = waypoints.length - 1;
          newDirection = -1;
        } else if (newWaypointIndex <= 0) {
          newWaypointIndex = 0;
          newDirection = 1;
        }
      }

      // Get current and next waypoints
      const currentPoint = waypoints[newWaypointIndex];
      const nextPoint = waypoints[newWaypointIndex + newDirection] || currentPoint;

      // Interpolate position
      const [lng, lat] = interpolate(currentPoint, nextPoint, newProgress);

      // Calculate heading
      const heading = calculateBearing(currentPoint[1], currentPoint[0], nextPoint[1], nextPoint[0]);

      // Vary speed slightly
      const newSpeed = Math.max(10, Math.min(80, speed + (Math.random() - 0.5) * 10));

      // Determine status
      let status: 'moving' | 'stopped' | 'idle' = 'moving';
      if (newSpeed < 5) status = 'stopped';
      else if (newSpeed < 15) status = 'idle';

      // Save location to database
      await BusLocation.create({
        busId,
        driverId: busData.driverId,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        heading: Math.round(heading),
        speed: Math.round(newSpeed),
        accuracy: 5 + Math.random() * 10, // 5-15 meters
        timestamp: new Date(),
        routeId: busData.routeId,
        status,
        passengers: busData.passengers,
        batteryLevel: 50 + Math.random() * 50, // 50-100%
      });

      // Update bus data
      busData.currentWaypointIndex = newWaypointIndex;
      busData.direction = newDirection;
      busData.progress = newProgress;
      busData.speed = newSpeed;

      // Occasionally change passenger count
      if (Math.random() > 0.9) {
        busData.passengers = Math.max(
          0,
          Math.min(
            50,
            busData.passengers + Math.floor((Math.random() - 0.5) * 10)
          )
        );
      }

      console.log(
        `🚌 ${busId.substring(0, 8)}... | Pos: ${lat.toFixed(4)},${lng.toFixed(4)} | ` +
        `Speed: ${Math.round(newSpeed)}km/h | Heading: ${Math.round(heading)}° | ` +
        `Passengers: ${busData.passengers} | Status: ${status}`
      );
    } catch (error) {
      console.error(`Error updating bus ${busId}:`, error);
    }
  }
}

// Main simulation loop
async function runSimulation() {
  const initialized = await initializeSimulation();
  if (!initialized) {
    process.exit(1);
  }

  console.log('\n🎬 Starting GPS simulation...');
  console.log('Press Ctrl+C to stop\n');

  // Update every 3 seconds
  setInterval(async () => {
    await updateBusPositions();
  }, 3000);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Stopping simulation...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run simulation
runSimulation().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
