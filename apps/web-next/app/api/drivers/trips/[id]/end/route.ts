import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TripLog from '@/lib/models/TripLog';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';
import { endTripSchema } from '@metro/shared/validation';

/**
 * POST /api/drivers/trips/:id/end
 * End a trip
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!hasRole(authResult, [UserRole.DRIVER, UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate input
    const validatedData = endTripSchema.parse(body);

    await connectDB();

    const trip = await TripLog.findById(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Check permissions for drivers
    if (hasRole(authResult, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
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
    trip.endLocation = validatedData.endLocation;
    trip.mileage = validatedData.mileage;
    trip.passengerCount = validatedData.passengerCount;
    trip.fuelUsed = validatedData.fuelUsed;
    trip.notes = validatedData.notes || trip.notes;
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
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to end trip', details: error.message },
      { status: 500 }
    );
  }
}
