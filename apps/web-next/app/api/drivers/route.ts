import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import Driver from '@/lib/models/Driver';
import { UserRole } from '@metro/shared';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.ADMIN])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const drivers = await Driver.find({})
      .populate('userId', 'email role isActive')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      drivers
    });
  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}
