import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth/middleware';
import BusLocation from '@/lib/models/BusLocation';
import Driver from '@/lib/models/Driver';
import { UserRole } from '@metro/shared';

// GET /api/tracking/location - Get bus locations
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.ADMIN, UserRole.OWNER, UserRole.PASSENGER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const busId = searchParams.get('busId');
    const routeId = searchParams.get('routeId');
    const status = searchParams.get('status');

    if (busId) {
      // Get latest location for specific bus
      const location = await (BusLocation as any).getLatestLocation(busId);
      return NextResponse.json({ success: true, location });
    }

    if (routeId) {
      // Get all buses on a specific route
      const locations = await BusLocation.aggregate([
        { $sort: { timestamp: -1 } },
        { $group: { _id: '$busId', latestLocation: { $first: '$$ROOT' } } },
        { $replaceRoot: { newRoot: '$latestLocation' } },
        { $match: { routeId, status: { $ne: 'offline' } } },
      ]);
      return NextResponse.json({ success: true, locations });
    }

    // Get all active buses
    const locations = await (BusLocation as any).getAllActiveBuses();
    
    return NextResponse.json({
      success: true,
      locations,
      count: locations.length,
    });
  } catch (error: any) {
    console.error('Error fetching bus locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus locations' },
      { status: 500 }
    );
  }
}

// POST /api/tracking/location - Update bus location (for drivers)
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.DRIVER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get driver profile
    const driver = await Driver.findOne({ userId: authResult.user.id });
    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.busId || body.latitude === undefined || body.longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: busId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Determine status based on speed
    let status: 'moving' | 'stopped' | 'idle' = 'idle';
    if (body.speed !== undefined) {
      if (body.speed > 5) status = 'moving';
      else if (body.speed > 0) status = 'stopped';
    }

    const location = await BusLocation.create({
      busId: body.busId,
      driverId: driver._id,
      location: {
        type: 'Point',
        coordinates: [body.longitude, body.latitude],
      },
      heading: body.heading,
      speed: body.speed || 0,
      accuracy: body.accuracy,
      altitude: body.altitude,
      timestamp: new Date(),
      routeId: body.routeId,
      tripId: body.tripId,
      status,
      passengers: body.passengers,
      nextStopETA: body.nextStopETA,
      batteryLevel: body.batteryLevel,
    });

    const populatedLocation = await BusLocation.findById(location._id)
      .populate('busId', 'registrationNumber busType capacity')
      .populate('driverId', 'fullName mobileNumber')
      .populate('routeId', 'routeName routeNumber');

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: populatedLocation,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error updating bus location:', error);
    return NextResponse.json(
      { error: 'Failed to update bus location' },
      { status: 500 }
    );
  }
}
