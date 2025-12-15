import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverAlert from '@/lib/models/DriverAlert';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * POST /api/drivers/alerts
 * Create a new driver alert
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!hasRole(authResult, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    
    // For drivers, use their own profile
    let driverId = body.driverId;
    if (hasRole(authResult, [UserRole.DRIVER]) && !hasRole(authResult, [UserRole.ADMIN])) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      driverId = driver._id.toString();
    }

    await connectDB();

    // Validate required fields
    if (!body.alertType) {
      return NextResponse.json({ error: 'Alert type is required' }, { status: 400 });
    }

    // Create new alert
    const alert = await DriverAlert.create({
      driverId,
      alertType: body.alertType,
      severity: body.severity || 'medium',
      eyeClosedDuration: body.eyeClosedDuration,
      moodState: body.moodState,
      timestamp: new Date(),
      location: body.location,
      tripId: body.tripId,
      busId: body.busId,
      routeId: body.routeId,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      data: { alert },
      message: 'Alert created successfully',
    });
  } catch (error: any) {
    console.error('Error creating driver alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create alert' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/drivers/alerts
 * Get driver alerts with filters
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!hasRole(authResult, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const driverIdParam = searchParams.get('driverId');
    const alertType = searchParams.get('alertType');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = {};

    // For drivers, only show their own alerts unless admin
    if (hasRole(authResult, [UserRole.DRIVER]) && !hasRole(authResult, [UserRole.ADMIN])) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      query.driverId = driver._id;
    } else if (driverIdParam) {
      query.driverId = driverIdParam;
    }

    if (alertType) query.alertType = alertType;
    if (severity) query.severity = severity;
    if (resolved !== null && resolved !== undefined) {
      query.resolved = resolved === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [alerts, total] = await Promise.all([
      DriverAlert.find(query)
        .populate('driverId', 'fullName userId')
        .populate('busId', 'registrationNumber')
        .populate('routeId', 'name code')
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip),
      DriverAlert.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching driver alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
