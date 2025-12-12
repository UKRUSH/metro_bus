/**
 * Seed Script for Routes and Schedules
 * 
 * Usage:
 *   pnpm seed:routes              # Seed routes and schedules (default: dev)
 *   pnpm seed:routes --env=test   # Seed for test environment
 *   pnpm seed:routes --env=prod   # Seed for production environment
 */

import mongoose from 'mongoose';
import Route from '../lib/models/Route';
import Schedule from '../lib/models/Schedule';
import Bus from '../lib/models/Bus';
import User from '../lib/models/User';

// Environment configuration
const ENV = process.argv.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/metro_bus';

console.log(`🌱 Seeding routes and schedules for environment: ${ENV}`);

// Sample routes data
const sampleRoutes = [
  {
    name: 'Colombo Fort - Galle Face',
    code: 'CF-GF-01',
    stops: [
      {
        name: 'Colombo Fort Bus Stand',
        location: { latitude: 6.9344, longitude: 79.8428, address: 'Fort, Colombo 01' },
        order: 1,
        estimatedDuration: 0,
      },
      {
        name: 'Pettah Junction',
        location: { latitude: 6.9387, longitude: 79.8517, address: 'Pettah, Colombo 11' },
        order: 2,
        estimatedDuration: 5,
      },
      {
        name: 'World Trade Center',
        location: { latitude: 6.9271, longitude: 79.8612, address: 'Echelon Square, Colombo 01' },
        order: 3,
        estimatedDuration: 10,
      },
      {
        name: 'Galle Face Green',
        location: { latitude: 6.9271, longitude: 79.8456, address: 'Galle Road, Colombo 03' },
        order: 4,
        estimatedDuration: 15,
      },
    ],
    distance: 8.5,
    estimatedDuration: 15,
    fare: 50,
    isActive: true,
    description: 'Main city route connecting Fort to Galle Face',
  },
  {
    name: 'Colombo - Kandy Express',
    code: 'COL-KDY-X1',
    stops: [
      {
        name: 'Colombo Central Bus Terminal',
        location: { latitude: 6.9344, longitude: 79.8428, address: 'Pettah, Colombo 01' },
        order: 1,
        estimatedDuration: 0,
      },
      {
        name: 'Kaduwela Junction',
        location: { latitude: 6.9334, longitude: 79.9832, address: 'Kaduwela' },
        order: 2,
        estimatedDuration: 45,
      },
      {
        name: 'Kadugannawa',
        location: { latitude: 7.2547, longitude: 80.5233, address: 'Kadugannawa' },
        order: 3,
        estimatedDuration: 90,
      },
      {
        name: 'Peradeniya Junction',
        location: { latitude: 7.2666, longitude: 80.5953, address: 'Peradeniya' },
        order: 4,
        estimatedDuration: 120,
      },
      {
        name: 'Kandy Clock Tower',
        location: { latitude: 7.2906, longitude: 80.6337, address: 'Kandy City Centre' },
        order: 5,
        estimatedDuration: 135,
      },
    ],
    distance: 115,
    estimatedDuration: 135,
    fare: 250,
    isActive: true,
    description: 'Express route from Colombo to Kandy via main highway',
  },
  {
    name: 'Colombo - Negombo Coastal',
    code: 'COL-NEG-C1',
    stops: [
      {
        name: 'Colombo Fort',
        location: { latitude: 6.9344, longitude: 79.8428, address: 'Fort, Colombo' },
        order: 1,
        estimatedDuration: 0,
      },
      {
        name: 'Wattala',
        location: { latitude: 6.9887, longitude: 79.8914, address: 'Wattala' },
        order: 2,
        estimatedDuration: 20,
      },
      {
        name: 'Ja-Ela',
        location: { latitude: 7.0742, longitude: 79.8918, address: 'Ja-Ela' },
        order: 3,
        estimatedDuration: 35,
      },
      {
        name: 'Katunayake Airport',
        location: { latitude: 7.1807, longitude: 79.8841, address: 'Katunayake' },
        order: 4,
        estimatedDuration: 45,
      },
      {
        name: 'Negombo Bus Stand',
        location: { latitude: 7.2088, longitude: 79.8358, address: 'Negombo' },
        order: 5,
        estimatedDuration: 60,
      },
    ],
    distance: 38,
    estimatedDuration: 60,
    fare: 120,
    isActive: true,
    description: 'Coastal route connecting Colombo to Negombo',
  },
  {
    name: 'Kandy - Nuwara Eliya Hill Route',
    code: 'KDY-NE-H1',
    stops: [
      {
        name: 'Kandy Bus Terminal',
        location: { latitude: 7.2906, longitude: 80.6337, address: 'Kandy' },
        order: 1,
        estimatedDuration: 0,
      },
      {
        name: 'Gampola',
        location: { latitude: 7.1644, longitude: 80.5770, address: 'Gampola' },
        order: 2,
        estimatedDuration: 25,
      },
      {
        name: 'Ramboda Falls',
        location: { latitude: 6.9739, longitude: 80.6425, address: 'Ramboda' },
        order: 3,
        estimatedDuration: 60,
      },
      {
        name: 'Nuwara Eliya Town',
        location: { latitude: 6.9497, longitude: 80.7891, address: 'Nuwara Eliya' },
        order: 4,
        estimatedDuration: 90,
      },
    ],
    distance: 77,
    estimatedDuration: 90,
    fare: 180,
    isActive: true,
    description: 'Scenic hill route from Kandy to Nuwara Eliya',
  },
  {
    name: 'Galle - Matara Coastal',
    code: 'GAL-MAT-C1',
    stops: [
      {
        name: 'Galle Fort Bus Stand',
        location: { latitude: 6.0329, longitude: 80.2168, address: 'Galle Fort' },
        order: 1,
        estimatedDuration: 0,
      },
      {
        name: 'Unawatuna Junction',
        location: { latitude: 6.0097, longitude: 80.2497, address: 'Unawatuna' },
        order: 2,
        estimatedDuration: 10,
      },
      {
        name: 'Weligama Bay',
        location: { latitude: 5.9744, longitude: 80.4297, address: 'Weligama' },
        order: 3,
        estimatedDuration: 30,
      },
      {
        name: 'Mirissa Beach',
        location: { latitude: 5.9461, longitude: 80.4564, address: 'Mirissa' },
        order: 4,
        estimatedDuration: 40,
      },
      {
        name: 'Matara Bus Terminal',
        location: { latitude: 5.9549, longitude: 80.5550, address: 'Matara' },
        order: 5,
        estimatedDuration: 50,
      },
    ],
    distance: 45,
    estimatedDuration: 50,
    fare: 100,
    isActive: true,
    description: 'Coastal route from Galle to Matara via southern beaches',
  },
];

async function seedRoutes() {
  try {
    console.log('📍 Seeding routes...');
    
    // Clear existing routes if in dev/test environment
    if (ENV !== 'prod') {
      const deletedCount = await Route.deleteMany({});
      console.log(`   Cleared ${deletedCount.deletedCount} existing routes`);
    }

    // Insert routes
    const insertedRoutes = await Route.insertMany(sampleRoutes);
    console.log(`   ✅ Inserted ${insertedRoutes.length} routes`);
    
    return insertedRoutes;
  } catch (error: any) {
    console.error('❌ Error seeding routes:', error.message);
    throw error;
  }
}

async function seedSchedules(routes: any[]) {
  try {
    console.log('📅 Seeding schedules...');
    
    // Get available buses and drivers
    const buses = await Bus.find({ isActive: true }).limit(10);
    const drivers = await User.find({ role: 'driver' }).limit(10);
    
    if (buses.length === 0) {
      console.warn('   ⚠️  No buses found. Please seed buses first.');
      return;
    }
    
    // Clear existing schedules if in dev/test environment
    if (ENV !== 'prod') {
      const deletedCount = await Schedule.deleteMany({});
      console.log(`   Cleared ${deletedCount.deletedCount} existing schedules`);
    }

    const schedules: any[] = [];
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const weekend = ['saturday', 'sunday'];
    const allDays = [...weekdays, ...weekend];

    // Create schedules for each route
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const busIndex = i % buses.length;
      const driverIndex = i % (drivers.length || 1);
      
      // Morning schedules (weekdays)
      schedules.push({
        routeId: route._id,
        busId: buses[busIndex]._id,
        driverId: drivers[driverIndex]?._id,
        departureTime: '06:00',
        arrivalTime: `${String(6 + Math.floor(route.estimatedDuration / 60)).padStart(2, '0')}:${String(route.estimatedDuration % 60).padStart(2, '0')}`,
        days: weekdays,
        isActive: true,
        availableSeats: buses[busIndex].capacity,
      });

      // Mid-morning (weekdays)
      schedules.push({
        routeId: route._id,
        busId: buses[(busIndex + 1) % buses.length]._id,
        driverId: drivers[(driverIndex + 1) % (drivers.length || 1)]?._id,
        departureTime: '09:00',
        arrivalTime: `${String(9 + Math.floor(route.estimatedDuration / 60)).padStart(2, '0')}:${String(route.estimatedDuration % 60).padStart(2, '0')}`,
        days: weekdays,
        isActive: true,
        availableSeats: buses[(busIndex + 1) % buses.length].capacity,
      });

      // Afternoon (all days)
      schedules.push({
        routeId: route._id,
        busId: buses[(busIndex + 2) % buses.length]._id,
        driverId: drivers[(driverIndex + 2) % (drivers.length || 1)]?._id,
        departureTime: '14:00',
        arrivalTime: `${String(14 + Math.floor(route.estimatedDuration / 60)).padStart(2, '0')}:${String(route.estimatedDuration % 60).padStart(2, '0')}`,
        days: allDays,
        isActive: true,
        availableSeats: buses[(busIndex + 2) % buses.length].capacity,
      });

      // Evening (all days)
      schedules.push({
        routeId: route._id,
        busId: buses[(busIndex + 3) % buses.length]._id,
        driverId: drivers[(driverIndex + 3) % (drivers.length || 1)]?._id,
        departureTime: '18:00',
        arrivalTime: `${String(18 + Math.floor(route.estimatedDuration / 60)).padStart(2, '0')}:${String(route.estimatedDuration % 60).padStart(2, '0')}`,
        days: allDays,
        isActive: true,
        availableSeats: buses[(busIndex + 3) % buses.length].capacity,
      });
    }

    const insertedSchedules = await Schedule.insertMany(schedules);
    console.log(`   ✅ Inserted ${insertedSchedules.length} schedules`);
    
  } catch (error: any) {
    console.error('❌ Error seeding schedules:', error.message);
    throw error;
  }
}

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Seed data
    const routes = await seedRoutes();
    await seedSchedules(routes);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Routes: ${routes.length}`);
    console.log(`   - Schedules: ${await Schedule.countDocuments()}`);
    
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the seed script
main();
