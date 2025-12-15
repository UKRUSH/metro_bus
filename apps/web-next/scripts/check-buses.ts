import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

interface IBus {
  _id: mongoose.Types.ObjectId;
  registrationNumber: string;
  ownerId?: mongoose.Types.ObjectId;
  capacity: number;
  busType: string;
}

const BusSchema = new mongoose.Schema({
  registrationNumber: String,
  capacity: Number,
  busType: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { strict: false });

const Bus = mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);

const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
  }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkBuses() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Find all buses
    const buses = await Bus.find({}).lean();
    console.log(`📊 Total buses in database: ${buses.length}\n`);

    if (buses.length === 0) {
      console.log('⚠️  No buses found in database!');
      return;
    }

    // Show bus details
    console.log('📋 Bus Details:');
    console.log('─'.repeat(80));
    buses.forEach((bus: any, index: number) => {
      console.log(`${index + 1}. ${bus.registrationNumber}`);
      console.log(`   ID: ${bus._id}`);
      console.log(`   Owner ID: ${bus.ownerId || 'NOT SET'}`);
      console.log(`   Capacity: ${bus.capacity}`);
      console.log(`   Type: ${bus.busType}`);
      console.log('');
    });

    // Find all owners
    const owners = await User.find({ role: 'owner' }).lean();
    console.log(`\n👥 Owners in database: ${owners.length}`);
    console.log('─'.repeat(80));
    owners.forEach((owner: any, index: number) => {
      console.log(`${index + 1}. ${owner.email}`);
      console.log(`   ID: ${owner._id}`);
      console.log(`   Name: ${owner.profile?.firstName} ${owner.profile?.lastName}`);
      console.log('');
    });

    // Count buses without ownerId
    const busesWithoutOwner = buses.filter((bus: any) => !bus.ownerId);
    if (busesWithoutOwner.length > 0) {
      console.log(`\n⚠️  ${busesWithoutOwner.length} buses don't have an owner assigned!`);
      console.log('\nTo assign buses to an owner, run:');
      console.log('  pnpm --filter web-next exec tsx scripts/assign-buses-to-owner.ts <owner-email>');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkBuses();
