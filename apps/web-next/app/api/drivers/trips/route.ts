import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TripLog from '@/lib/models/TripLog';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * GET /api/drivers/trips
 * Get trip logs with filters
 */
export async function GET(req: NextRequest) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    await connectDB();

    // Build query
    const query: any = {};

    // Role-based filtering
    if (hasRole(user, [UserRole.DRIVER])) {
      // Drivers can only see their own trips
      const driver = await Driver.findOne({ userId: user.userId });
      if (!driver) {
        console.error('Driver profile not found for userId:', user.userId);
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      console.log('Found driver:', driver._id, 'for userId:', user.userId);
      query.driverId = driver._id;
    } else if (searchParams.get('driverId')) {
      query.driverId = searchParams.get('driverId');
    }

    // Other filters
    if (searchParams.get('busId')) query.busId = searchParams.get('busId');
    if (searchParams.get('routeId')) query.routeId = searchParams.get('routeId');
    if (searchParams.get('scheduleId')) query.scheduleId = searchParams.get('scheduleId');
    if (searchParams.get('status')) query.status = searchParams.get('status');

    // Date filters
    if (searchParams.get('startDate')) {
      query.startTime = { ...query.startTime, $gte: new Date(searchParams.get('startDate')!) };
    }
    if (searchParams.get('endDate')) {
      query.startTime = { ...query.startTime, $lte: new Date(searchParams.get('endDate')!) };
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      TripLog.find(query)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('driverId', 'userId fullName licenseNumber status')
        .populate('busId', 'registrationNumber busType capacity')
        .populate('routeId', 'name origin destination')
        .populate('scheduleId', 'departureTime arrivalTime')
        .lean(),
      TripLog.countDocuments(query),
    ]);

    console.log('Trips query:', JSON.stringify(query));
    console.log('Found trips count:', trips.length, 'Total:', total);

    return NextResponse.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get trips error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip logs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drivers/trips
 * Start a new trip
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
    if (!body.busId || !body.routeId) {
      return NextResponse.json(
        { error: 'Bus ID and Route ID are required' },
        { status: 400 }
      );
    }

    // Get driver ID
    let driverId;
    if (hasRole(user, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: user.userId });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      driverId = driver._id;
    } else {
      driverId = body.driverId;
    }

    // Check for active trips
    const activeTrip = await TripLog.findOne({
      driverId,
      status: 'active',
    });

    if (activeTrip) {
      return NextResponse.json(
        { error: 'You have an active trip. Please end it before starting a new one.', trip: activeTrip },
        { status: 400 }
      );
    }

    // Create trip log
    const trip = await TripLog.create({
      driverId,
      busId: body.busId,
      scheduleId: body.scheduleId,
      routeId: body.routeId,
      startTime: new Date(),
      startLocation: body.startLocation,
      status: 'started',
    });

    // Update driver's trip count
    await Driver.findByIdAndUpdate(driverId, {
      $inc: { totalTrips: 1 },
    });

    const populatedTrip = await TripLog.findById(trip._id)
      .populate('driverId', 'userId documents.licenseNumber status')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('routeId', 'name origin destination')
      .populate('scheduleId', 'departureTime arrivalTime');

    return NextResponse.json(
      {
        message: 'Trip started successfully',
        trip: populatedTrip,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Start trip error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to start trip', details: error.message },
      { status: 500 }
    );
  }
}
