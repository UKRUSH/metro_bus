import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/lib/models/Booking';
import Schedule from '@/lib/models/Schedule';
import Route from '@/lib/models/Route';
import { authenticateRequest } from '@/lib/auth/middleware';

// GET /api/bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { userId: authResult.userId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('routeId', 'name code fare')
      .populate('scheduleId', 'departureTime arrivalTime')
      .populate('busId', 'registrationNumber')
      .sort({ travelDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { scheduleId, seatNumber, travelDate, paymentMethod } = body;

    // Validate required fields
    if (!scheduleId || !seatNumber || !travelDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get schedule and route info
    const schedule = await Schedule.findById(scheduleId).populate('routeId busId');
    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Check if seat is already booked
    const existingBooking = await Booking.findOne({
      scheduleId,
      seatNumber,
      travelDate: new Date(travelDate),
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Seat already booked' },
        { status: 400 }
      );
    }

    // Get route fare
    const route = await Route.findById(schedule.routeId);
    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    // Create booking
    const booking = await Booking.create({
      userId: authResult.userId,
      scheduleId,
      routeId: schedule.routeId,
      busId: schedule.busId,
      seatNumber,
      travelDate: new Date(travelDate),
      price: route.fare,
      status: paymentMethod ? 'confirmed' : 'pending',
      paymentStatus: paymentMethod ? 'completed' : 'pending',
      paymentMethod,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('routeId', 'name code fare')
      .populate('scheduleId', 'departureTime arrivalTime')
      .populate('busId', 'registrationNumber');

    return NextResponse.json({
      success: true,
      data: { booking: populatedBooking },
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
