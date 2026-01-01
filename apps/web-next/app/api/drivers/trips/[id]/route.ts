import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TripLog from '@/lib/models/TripLog';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * GET /api/drivers/trips/:id
 * Get single trip log
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const trip = await TripLog.findById(id)
      .populate('driverId', 'userId documents.licenseNumber status')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('routeId', 'name origin destination stops')
      .populate('scheduleId', 'departureTime arrivalTime');

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check permissions
    if (hasRole(user, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: user.userId });
      if (!driver || trip.driverId.toString() !== driver._id.toString()) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
      }
    }

    return NextResponse.json({ trip });
  } catch (error: any) {
    console.error('Get trip error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drivers/trips/:id
 * Update trip log (update mileage, passenger count, etc.)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const trip = await TripLog.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check permissions for drivers
    if (hasRole(user, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: user.userId });
      if (!driver || trip.driverId.toString() !== driver._id.toString()) {
        return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
      }
    }

    // Update fields
    if (body.endLocation) trip.endLocation = body.endLocation;
    if (body.mileage !== undefined) trip.mileage = body.mileage;
    if (body.passengerCount !== undefined) trip.passengerCount = body.passengerCount;
    if (body.passengersCount !== undefined) trip.passengerCount = body.passengersCount;
    if (body.fuelUsed !== undefined) trip.fuelUsed = body.fuelUsed;
    if (body.notes) trip.notes = body.notes;
    if (body.distanceCovered !== undefined) trip.distanceCovered = body.distanceCovered;

    // Update status if not already completed
    if (trip.status === 'started') {
      trip.status = 'in_progress';
    }

    await trip.save();

    const populatedTrip = await TripLog.findById(trip._id)
      .populate('driverId', 'userId documents.licenseNumber status')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('routeId', 'name origin destination')
      .populate('scheduleId', 'departureTime arrivalTime');

    return NextResponse.json({
      message: 'Trip updated successfully',
      trip: populatedTrip,
    });
  } catch (error: any) {
    console.error('Update trip error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update trip', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drivers/trips/:id
 * Cancel a trip (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    await connectDB();

    const trip = await TripLog.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    trip.status = 'cancelled';
    await trip.save();

    return NextResponse.json({
      message: 'Trip cancelled successfully',
      trip,
    });
  } catch (error: any) {
    console.error('Cancel trip error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel trip', details: error.message },
      { status: 500 }
    );
  }
}
