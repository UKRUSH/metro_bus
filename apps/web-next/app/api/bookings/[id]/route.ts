import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import { authenticateRequest } from '@/lib/auth/middleware';

// GET /api/bookings/:id - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = params;
    const booking = await Booking.findById(id)
      .populate('routeId', 'name code fare stops')
      .populate('scheduleId', 'departureTime arrivalTime')
      .populate('busId', 'registrationNumber capacity busType');

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking or is admin
    const bookingUserId = typeof booking.userId === 'object' && booking.userId._id 
      ? booking.userId._id.toString() 
      : booking.userId.toString();
      
    if (
      bookingUserId !== authResult.userId &&
      authResult.role !== 'admin' &&
      authResult.role !== 'finance'
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { booking },
    });
  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/:id/cancel - Cancel booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const booking = await Booking.findById(params.id);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel this booking' },
        { status: 400 }
      );
    }

    // Check if travel date is in the past
    if (new Date(booking.travelDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel past bookings' },
        { status: 400 }
      );
    }

    booking.status = 'cancelled';
    await booking.save();

    return NextResponse.json({
      success: true,
      data: { booking },
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
