import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Owner from '@/lib/models/Owner';
import User from '@/lib/models/User';
import Bus from '@/lib/models/Bus';
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

    const owner = await Owner.findById(id);
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Update owner status to rejected/inactive
    owner.status = 'suspended';
    await owner.save();

    // Deactivate the user account
    await User.findByIdAndUpdate(owner.userId, { 
      isActive: false 
    });

    // Reject all buses owned by this owner
    await Bus.updateMany(
      { ownerId: owner.userId },
      { 
        currentStatus: 'rejected',
        approvalStatus: 'rejected',
        rejectionReason: reason || 'Owner application rejected'
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Owner and associated buses rejected successfully',
      owner
    });
  } catch (error: any) {
    console.error('Error rejecting owner:', error);
    return NextResponse.json(
      { error: 'Failed to reject owner' },
      { status: 500 }
    );
  }
}
