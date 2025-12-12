import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Driver from '@/lib/models/Driver';
import User from '@/lib/models/User';
import { UserRole } from '@metro/shared';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAuth([UserRole.ADMIN, UserRole.OWNER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const params = await context.params;
    const driver = await Driver.findById(params.id);
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Update driver status to active (so they can login)
    driver.status = 'active';
    await driver.save();

    // Also verify and activate the user account
    await User.findByIdAndUpdate(driver.userId, { 
      isVerified: true,
      isActive: true 
    });

    return NextResponse.json({
      success: true,
      message: 'Driver approved successfully',
      driver
    });
  } catch (error: any) {
    console.error('Error approving driver:', error);
    return NextResponse.json(
      { error: 'Failed to approve driver' },
      { status: 500 }
    );
  }
}
