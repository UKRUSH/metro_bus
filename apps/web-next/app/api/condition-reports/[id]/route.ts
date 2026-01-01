import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import ConditionReport from '@/lib/models/ConditionReport';
import { UserRole } from '@metro/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { id } = await params;

    const report = await ConditionReport.findById(id)
      .populate('driverId', 'fullName licenseNumber email mobileNumber')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('reviewedBy', 'email profile.firstName profile.lastName');

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Error fetching condition report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch condition report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { id } = await params;

    const report = await ConditionReport.findByIdAndUpdate(
      id,
      {
        status: body.status,
        reviewedBy: user.userId,
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes,
      },
      { new: true }
    )
      .populate('driverId', 'fullName licenseNumber')
      .populate('busId', 'registrationNumber busType')
      .populate('reviewedBy', 'email profile.firstName profile.lastName');

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Error updating condition report:', error);
    return NextResponse.json(
      { error: 'Failed to update condition report' },
      { status: 500 }
    );
  }
}
