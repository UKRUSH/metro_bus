import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Owner from '@/lib/models/Owner';
import Bus from '@/lib/models/Bus';
import { UserRole } from '@metro/shared';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.ADMIN])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const owners = await Owner.find({})
      .populate('userId', 'email role isActive')
      .sort({ createdAt: -1 })
      .lean();

    // Get actual bus counts for each owner
    // Note: Bus.ownerId references User._id, not Owner._id
    const ownersWithBusCounts = await Promise.all(
      owners.map(async (owner) => {
        const busCount = await Bus.countDocuments({ ownerId: owner.userId });
        return {
          ...owner,
          totalBuses: busCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      owners: ownersWithBusCounts
    });
  } catch (error: any) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}
