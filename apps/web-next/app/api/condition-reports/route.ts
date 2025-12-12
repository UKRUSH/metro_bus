import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import ConditionReport from '@/lib/models/ConditionReport';
import Driver from '@/lib/models/Driver';
import { UserRole } from '@metro/shared';

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.DRIVER, UserRole.ADMIN, UserRole.OWNER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const busId = searchParams.get('busId');
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = {};

    // If driver, only show their reports
    if (authResult.user.role === UserRole.DRIVER) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
      if (driver) {
        query.driverId = driver._id;
      }
    }

    if (busId) query.busId = busId;
    if (driverId) query.driverId = driverId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate);
      if (endDate) query.reportDate.$lte = new Date(endDate);
    }

    const reports = await ConditionReport.find(query)
      .populate('driverId', 'fullName licenseNumber')
      .populate('busId', 'registrationNumber busType')
      .populate('reviewedBy', 'email profile.firstName profile.lastName')
      .sort({ reportDate: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('Error fetching condition reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch condition reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.DRIVER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get driver
    const driver = await Driver.findOne({ userId: authResult.user.id });
    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.busId || !body.shiftType || !body.overallCondition || 
        body.odometerReading === undefined || body.fuelLevel === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create condition report
    const report = await ConditionReport.create({
      driverId: driver._id,
      busId: body.busId,
      reportDate: new Date(),
      shiftType: body.shiftType,
      overallCondition: body.overallCondition,
      checklistItems: body.checklistItems || [],
      odometerReading: body.odometerReading,
      fuelLevel: body.fuelLevel,
      images: body.images || [],
      additionalNotes: body.additionalNotes,
      issuesReported: body.issuesReported || false,
      issueDescription: body.issueDescription,
      urgency: body.urgency,
      maintenanceRequired: body.maintenanceRequired || false,
      estimatedRepairTime: body.estimatedRepairTime,
      location: body.location,
      status: 'submitted',
    });

    const populatedReport = await ConditionReport.findById(report._id)
      .populate('driverId', 'fullName licenseNumber')
      .populate('busId', 'registrationNumber busType');

    return NextResponse.json({
      success: true,
      message: 'Condition report submitted successfully',
      report: populatedReport,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating condition report:', error);
    return NextResponse.json(
      { error: 'Failed to create condition report' },
      { status: 500 }
    );
  }
}
