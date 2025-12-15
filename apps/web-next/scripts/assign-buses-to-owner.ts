import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BusSchema = new mongoose.Schema({
  registrationNumber: String,
  capacity: Number,
  busType: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { strict: false });

const Bus = mongoose.models.Bus || mongoose.model('Bus', BusSchema);

const UserSchema = new mongoose.Schema({
  email: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
  }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function assignBusesToOwner() {
  try {
    const ownerEmail = process.argv[2];
    
    if (!ownerEmail) {
      console.error('❌ Please provide owner email as argument');
      console.log('Usage: pnpm --filter web-next exec tsx scripts/assign-buses-to-owner.ts <owner-email>');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Find the owner
    const owner = await User.findOne({ email: ownerEmail, role: 'owner' });
    
    if (!owner) {
      console.error(`❌ Owner with email "${ownerEmail}" not found!`);
      
      // Show available owners
      const owners = await User.find({ role: 'owner' });
      if (owners.length > 0) {
        console.log('\n📋 Available owners:');
        owners.forEach((o: any) => {
          console.log(`   - ${o.email} (${o.profile?.firstName} ${o.profile?.lastName})`);
        });
      }
      process.exit(1);
    }

    console.log(`👤 Found owner: ${owner.email}`);
    console.log(`   ID: ${owner._id}`);
    console.log(`   Name: ${owner.profile?.firstName} ${owner.profile?.lastName}\n`);

    // Find buses without owner or with different owner
    const assignOption = process.argv[3] || 'unassigned';
    
    let busQuery: any = {};
    if (assignOption === 'all') {
      console.log('🔄 Assigning ALL buses to this owner...\n');
    } else {
      busQuery = { $or: [{ ownerId: null }, { ownerId: { $exists: false } }] };
      console.log('🔄 Assigning only unassigned buses to this owner...\n');
    }

    const buses = await Bus.find(busQuery);
    
    if (buses.length === 0) {
      console.log('⚠️  No buses to assign!');
      process.exit(0);
    }

    console.log(`📊 Found ${buses.length} buses to assign:`);
    buses.forEach((bus: any, index: number) => {
      console.log(`   ${index + 1}. ${bus.registrationNumber}`);
    });

    // Update buses
    const result = await Bus.updateMany(
      busQuery,
      { $set: { ownerId: owner._id } }
    );

    console.log(`\n✅ Successfully assigned ${result.modifiedCount} buses to ${owner.email}`);
    
    // Verify
    const ownerBuses = await Bus.find({ ownerId: owner._id });
    console.log(`\n📊 Total buses owned by ${owner.email}: ${ownerBuses.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

assignBusesToOwner();
