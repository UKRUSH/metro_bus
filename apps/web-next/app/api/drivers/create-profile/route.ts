import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Driver from '@/lib/models/Driver';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function POST(req: NextRequest) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Check if driver profile already exists
    const existingDriver = await Driver.findOne({ userId: user.id });
    if (existingDriver) {
      return NextResponse.json({
        success: true,
        message: 'Driver profile already exists',
        driver: existingDriver,
      });
    }

    // Get user details
    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create driver profile
    const driver = new Driver({
      userId: user.id,
      fullName: userDoc.name || userDoc.email,
      licenseNumber: `DL-${Date.now()}`,
      mobileNumber: userDoc.phone || '0000000000',
      experience: 2,
      specialization: ['city'],
      approvalStatus: 'approved',
      createdAt: new Date(),
    });

    await driver.save();

    return NextResponse.json({
      success: true,
      message: 'Driver profile created successfully',
      driver,
    });
  } catch (error: any) {
    console.error('Error creating driver profile:', error);
    return NextResponse.json(
      { error: 'Failed to create driver profile', details: error.message },
      { status: 500 }
    );
  }
}
