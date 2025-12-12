import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';
import Booking from '@/lib/models/Booking';
import Route from '@/lib/models/Route';
import Bus from '@/lib/models/Bus';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { createScheduleSchema, UserRole } from '@metro/shared';

// GET /api/routes/:id/schedules - Get schedules for a route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const query: any = {
      routeId: params.id,
      isActive: true,
    };

    // Filter by day of week if date provided
    if (date) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      query.days = dayOfWeek;
    }

    const schedules = await Schedule.find(query)
      .populate('busId', 'registrationNumber capacity busType')
      .populate('driverId', 'profile.firstName profile.lastName')
      .sort({ departureTime: 1 })
      .lean();

    // Get booked seats for each schedule if date provided
    if (date) {
      const schedulesWithSeats = await Promise.all(
        schedules.map(async (schedule) => {
          const bookings = await Booking.find({
            scheduleId: schedule._id,
            travelDate: new Date(date),
            status: { $in: ['pending', 'confirmed'] },
          }).select('seatNumber');

          const bookedSeats = bookings.map((b) => b.seatNumber);
          const availableSeats = (schedule as any).busId?.capacity
            ? (schedule as any).busId.capacity - bookedSeats.length
            : schedule.availableSeats - bookedSeats.length;

          return {
            ...schedule,
            bookedSeats,
            availableSeats,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: { schedules: schedulesWithSeats },
      });
    }

    return NextResponse.json({
      success: true,
      data: { schedules },
    });
  } catch (error: any) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/routes/:id/schedules - Create new schedule (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult || !hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    
    // Override routeId with the one from URL
    body.routeId = params.id;
    
    // Validate request body
    const validationResult = createScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if route exists
    const route = await Route.findById(params.id);
    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    // Check if bus exists
    const bus = await Bus.findById(validationResult.data.busId);
    if (!bus) {
      return NextResponse.json(
        { success: false, error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Check for schedule conflicts (same bus, overlapping time, same day)
    const existingSchedules = await Schedule.find({
      busId: validationResult.data.busId,
      isActive: true,
      days: { $in: validationResult.data.days },
    });

    const hasConflict = existingSchedules.some((schedule) => {
      const newDep = validationResult.data.departureTime;
      const newArr = validationResult.data.arrivalTime;
      const existingDep = schedule.departureTime;
      const existingArr = schedule.arrivalTime;
      
      // Check if times overlap
      return (newDep >= existingDep && newDep < existingArr) ||
             (newArr > existingDep && newArr <= existingArr) ||
             (newDep <= existingDep && newArr >= existingArr);
    });

    if (hasConflict) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schedule conflict: Bus is already scheduled at this time on selected days' 
        },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = await Schedule.create({
      ...validationResult.data,
      availableSeats: bus.capacity,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('routeId', 'name code')
      .populate('busId', 'registrationNumber capacity busType')
      .populate('driverId', 'profile.firstName profile.lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: { schedule: populatedSchedule },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
