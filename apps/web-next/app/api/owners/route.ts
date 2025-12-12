import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Owner from '@/lib/models/Owner';
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
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      owners
    });
  } catch (error: any) {
    console.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch owners' },
      { status: 500 }
    );
  }
}
