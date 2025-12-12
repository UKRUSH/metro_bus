import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import ConditionReport from '@/lib/models/ConditionReport';
import { UserRole } from '@metro/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth([UserRole.DRIVER, UserRole.ADMIN, UserRole.OWNER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const report = await ConditionReport.findById(params.id)
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAuth([UserRole.ADMIN, UserRole.OWNER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    const report = await ConditionReport.findByIdAndUpdate(
      params.id,
      {
        status: body.status,
        reviewedBy: authResult.user.id,
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
