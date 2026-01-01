import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TripLog from '@/lib/models/TripLog';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * POST /api/drivers/trips/:id/end
 * End a trip
 */
export async function POST(
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

    // Check if trip is already ended
    if (trip.status === 'completed') {
      return NextResponse.json(
        { error: 'Trip already completed', trip },
        { status: 400 }
      );
    }

    // Update trip with end details
    trip.endTime = new Date();
    trip.endLocation = body.endLocation;
    trip.mileage = body.mileage;
    trip.passengerCount = body.passengersCount || body.passengerCount;
    trip.fuelUsed = body.fuelUsed;
    trip.notes = body.endNotes || body.notes || trip.notes;
    trip.distanceCovered = body.distanceCovered;
    trip.status = 'completed';

    await trip.save();

    const populatedTrip = await TripLog.findById(trip._id)
      .populate('driverId', 'userId documents.licenseNumber status')
      .populate('busId', 'registrationNumber busType capacity')
      .populate('routeId', 'name origin destination')
      .populate('scheduleId', 'departureTime arrivalTime');

    return NextResponse.json({
      message: 'Trip ended successfully',
      trip: populatedTrip,
    });
  } catch (error: any) {
    console.error('End trip error:', error);
    
    return NextResponse.json(
      { error: 'Failed to end trip', details: error.message },
      { status: 500 }
    );
  }
}
