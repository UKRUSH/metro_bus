import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/lib/models/Bus';
import Route from '@/lib/models/Route';
import DriverScheduleAssignment from '@/lib/models/DriverScheduleAssignment';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * GET /api/drivers/available-assignments
 * Get available buses and routes for assignment
 */
export async function GET(req: NextRequest) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const assignmentDate = new Date(date);
    assignmentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(assignmentDate);
    endDate.setHours(23, 59, 59, 999);

    // Get buses that are already assigned on this date
    const assignedBuses = await DriverScheduleAssignment.find({
      assignmentDate: { $gte: assignmentDate, $lte: endDate },
      status: { $in: ['approved', 'active'] },
    }).distinct('busId');

    // Get available buses (not assigned and in good status)
    const buses = await Bus.find({
      _id: { $nin: assignedBuses },
      currentStatus: { $in: ['available', 'in-service'] },
      approvalStatus: 'approved',
    })
      .select('registrationNumber busType capacity manufacturer busModel facilities currentStatus routeId')
      .populate('ownerId', 'businessName')
      .lean();

    // Get all active routes
    const routes = await Route.find({ isActive: true })
      .select('name origin destination distance estimatedDuration fare')
      .lean();

    // Get buses with their assigned routes (if any)
    const busesWithRoutes = await Promise.all(
      buses.map(async (bus: any) => {
        let route = null;
        if (bus.routeId) {
          route = await Route.findById(bus.routeId).select('name origin destination').lean();
        }
        return {
          _id: bus._id,
          registrationNumber: bus.registrationNumber,
          busType: bus.busType,
          capacity: bus.capacity,
          manufacturer: bus.manufacturer,
          busModel: bus.busModel,
          facilities: bus.facilities,
          currentStatus: bus.currentStatus,
          route: route,
        };
      })
    );

    return NextResponse.json({
      success: true,
      availableBuses: busesWithRoutes,
      allRoutes: routes,
      date: assignmentDate,
    });
  } catch (error: any) {
    console.error('Error fetching available assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available assignments', details: error.message },
      { status: 500 }
    );
  }
}
