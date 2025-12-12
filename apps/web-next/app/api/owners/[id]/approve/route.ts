import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Owner from '@/lib/models/Owner';
import User from '@/lib/models/User';
import Bus from '@/lib/models/Bus';
import { UserRole } from '@metro/shared';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth([UserRole.ADMIN])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const owner = await Owner.findById(params.id);
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Update owner status to approved
    owner.status = 'approved';
    await owner.save();

    // Also verify the user account
    await User.findByIdAndUpdate(owner.userId, { 
      isVerified: true,
      isActive: true 
    });

    // Approve all buses owned by this owner
    await Bus.updateMany(
      { ownerId: owner._id },
      { status: 'approved' }
    );

    return NextResponse.json({
      success: true,
      message: 'Owner and associated buses approved successfully',
      owner
    });
  } catch (error: any) {
    console.error('Error approving owner:', error);
    return NextResponse.json(
      { error: 'Failed to approve owner' },
      { status: 500 }
    );
  }
}
