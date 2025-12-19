import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverScheduleAssignment from '@/lib/models/DriverScheduleAssignment';
import Driver from '@/lib/models/Driver';
import User from '@/lib/models/User';
import Bus from '@/lib/models/Bus';
import Route from '@/lib/models/Route';
import Schedule from '@/lib/models/Schedule';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * GET /api/drivers/schedule-assignments
 * Get driver schedule assignments
 */
export async function GET(req: NextRequest) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const driverIdParam = searchParams.get('driverId');

    let query: any = {};

    // Drivers can only see their own assignments
    if (hasRole(user, [UserRole.DRIVER]) && !hasRole(user, [UserRole.ADMIN])) {
      const driver = await Driver.findOne({ userId: user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      query.driverId = driver._id;
    } else if (driverIdParam) {
      // Admin can filter by specific driver
      query.driverId = driverIdParam;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.assignmentDate = { $gte: startDate, $lte: endDate };
    }

    const assignments = await DriverScheduleAssignment.find(query)
      .populate('driverId', 'fullName licenseNumber mobileNumber')
      .populate('busId', 'registrationNumber busType capacity currentStatus')
      .populate('routeId', 'name origin destination')
      .populate('scheduleId')
      .populate('approvedBy', 'profile.firstName profile.lastName email')
      .sort({ assignmentDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: { assignments },
    });
  } catch (error: any) {
    console.error('Error fetching schedule assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule assignments', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drivers/schedule-assignments
 * Create a new schedule assignment request
 */
export async function POST(req: NextRequest) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    // Validate required fields
    if (!body.busId || !body.routeId || !body.assignmentDate) {
      return NextResponse.json(
        { error: 'Bus, route, and assignment date are required' },
        { status: 400 }
      );
    }

    // Determine driver ID
    let driverId = body.driverId;
    let requestedBy: 'driver' | 'admin' = 'admin';

    if (hasRole(user, [UserRole.DRIVER]) && !hasRole(user, [UserRole.ADMIN])) {
      const driver = await Driver.findOne({ userId: user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      driverId = driver._id.toString();
      requestedBy = 'driver';
    }

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    // Check if bus exists and is available
    const bus = await Bus.findById(body.busId);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }
    if (bus.currentStatus !== 'available' && bus.currentStatus !== 'in-service') {
      return NextResponse.json({ error: 'Bus is not available' }, { status: 400 });
    }

    // Check if route exists
    const route = await Route.findById(body.routeId);
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Check for existing assignment on the same date
    const assignmentDate = new Date(body.assignmentDate);
    assignmentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(assignmentDate);
    endDate.setHours(23, 59, 59, 999);

    const existingAssignment = await DriverScheduleAssignment.findOne({
      driverId,
      assignmentDate: { $gte: assignmentDate, $lte: endDate },
      status: { $in: ['pending', 'approved', 'active'] },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'You already have an assignment for this date' },
        { status: 400 }
      );
    }

    // Check if bus is already assigned to another driver on this date
    const busAssignment = await DriverScheduleAssignment.findOne({
      busId: body.busId,
      assignmentDate: { $gte: assignmentDate, $lte: endDate },
      status: { $in: ['approved', 'active'] },
    });

    if (busAssignment) {
      return NextResponse.json(
        { error: 'This bus is already assigned to another driver on this date' },
        { status: 400 }
      );
    }

    // Find matching schedule if exists
    const dayOfWeek = assignmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const matchingSchedule = await Schedule.findOne({
      busId: body.busId,
      routeId: body.routeId,
      days: dayOfWeek,
      isActive: true,
    });

    // Admin can directly approve, driver requests need approval
    const status = requestedBy === 'admin' ? 'approved' : 'pending';
    const approvalData = requestedBy === 'admin' ? {
      approvedBy: user.id,
      approvedAt: new Date(),
    } : {};

    // Create assignment
    const assignment = await DriverScheduleAssignment.create({
      driverId,
      busId: body.busId,
      routeId: body.routeId,
      scheduleId: matchingSchedule?._id,
      assignmentDate: assignmentDate,
      status,
      requestedBy,
      requestedAt: new Date(),
      notes: body.notes,
      startTime: body.startTime || matchingSchedule?.departureTime,
      endTime: body.endTime || matchingSchedule?.arrivalTime,
      ...approvalData,
    });

    const populatedAssignment = await DriverScheduleAssignment.findById(assignment._id)
      .populate('driverId', 'fullName licenseNumber')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('routeId', 'name origin destination')
      .populate('scheduleId')
      .lean();

    return NextResponse.json({
      success: true,
      data: { assignment: populatedAssignment },
      message: requestedBy === 'admin' 
        ? 'Schedule assignment created and approved' 
        : 'Schedule assignment request submitted. Waiting for admin approval.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating schedule assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule assignment', details: error.message },
      { status: 500 }
    );
  }
}
