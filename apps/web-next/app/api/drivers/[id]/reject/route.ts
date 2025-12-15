import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Driver from '@/lib/models/Driver';
import User from '@/lib/models/User';
import { UserRole } from '@metro/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAuth([UserRole.ADMIN])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    await dbConnect();

    const driver = await Driver.findById(id);
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Update driver status to rejected/inactive
    driver.status = 'rejected';
    await driver.save();

    // Deactivate the user account
    await User.findByIdAndUpdate(driver.userId, { 
      isActive: false 
    });

    return NextResponse.json({
      success: true,
      message: 'Driver rejected successfully',
      driver
    });
  } catch (error: any) {
    console.error('Error rejecting driver:', error);
    return NextResponse.json(
      { error: 'Failed to reject driver' },
      { status: 500 }
    );
  }
}
