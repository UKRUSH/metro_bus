/**
 * Script to create a Driver profile for an existing user
 * Usage: npx tsx scripts/create-driver-profile.ts <email>
 */

import { connectDB } from '../lib/mongodb';
import User from '../lib/models/User';
import Driver from '../lib/models/Driver';

async function createDriverProfile(email: string) {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.name} (${user.email})`);
    console.log(`  User ID: ${user._id}`);
    console.log(`  Role: ${user.role}`);

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId: user._id });
    if (existingDriver) {
      console.log(`✓ Driver profile already exists!`);
      console.log(`  Driver ID: ${existingDriver._id}`);
      console.log(`  Full Name: ${existingDriver.fullName}`);
      console.log(`  License: ${existingDriver.licenseNumber}`);
      console.log(`  Status: ${existingDriver.approvalStatus}`);
      return;
    }

    // Create driver profile
    const driver = new Driver({
      userId: user._id,
      fullName: user.name,
      licenseNumber: `DL-${Date.now()}`, // Generate temporary license number
      mobileNumber: user.phone || '0000000000',
      experience: 2, // Default 2 years
      specialization: ['city'], // Default city routes
      approvalStatus: 'approved', // Auto-approve for testing
      createdAt: new Date(),
    });

    await driver.save();

    console.log('\n✅ Driver profile created successfully!');
    console.log(`  Driver ID: ${driver._id}`);
    console.log(`  Full Name: ${driver.fullName}`);
    console.log(`  License: ${driver.licenseNumber}`);
    console.log(`  Mobile: ${driver.mobileNumber}`);
    console.log(`  Experience: ${driver.experience} years`);
    console.log(`  Status: ${driver.approvalStatus}`);
    
    console.log('\n🎉 You can now use the schedule assignment system!');
    
  } catch (error) {
    console.error('Error creating driver profile:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get email from command line args
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/create-driver-profile.ts <email>');
  console.error('Example: npx tsx scripts/create-driver-profile.ts driver@example.com');
  process.exit(1);
}

createDriverProfile(email);
