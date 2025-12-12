import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';
import Bus from '@/lib/models/Bus';
import Booking from '@/lib/models/Booking';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { updateScheduleSchema, UserRole } from '@metro/shared';

// GET /api/schedules/:id - Get schedule details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const schedule = await Schedule.findById(params.id)
      .populate('routeId', 'name code stops distance estimatedDuration fare')
      .populate('busId', 'registrationNumber capacity busType')
      .populate('driverId', 'profile.firstName profile.lastName email phone')
      .lean();

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { schedule },
    });
  } catch (error: any) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/:id - Update schedule (Admin only)
export async function PUT(
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
    
    // Validate request body
    const validationResult = updateScheduleSchema.safeParse(body);
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

    // Check if schedule exists
    const existingSchedule = await Schedule.findById(params.id);
    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // If bus is being changed, verify it exists and update available seats
    if (validationResult.data.busId) {
      const bus = await Bus.findById(validationResult.data.busId);
      if (!bus) {
        return NextResponse.json(
          { success: false, error: 'Bus not found' },
          { status: 404 }
        );
      }
      
      // Check for conflicts with new bus
      const busId = validationResult.data.busId;
      const days = validationResult.data.days || existingSchedule.days;
      const departureTime = validationResult.data.departureTime || existingSchedule.departureTime;
      const arrivalTime = validationResult.data.arrivalTime || existingSchedule.arrivalTime;

      const conflicts = await Schedule.find({
        _id: { $ne: params.id },
        busId,
        isActive: true,
        days: { $in: days },
      });

      const hasConflict = conflicts.some((schedule) => {
        const existingDep = schedule.departureTime;
        const existingArr = schedule.arrivalTime;
        
        return (departureTime >= existingDep && departureTime < existingArr) ||
               (arrivalTime > existingDep && arrivalTime <= existingArr) ||
               (departureTime <= existingDep && arrivalTime >= existingArr);
      });

      if (hasConflict) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Schedule conflict: Bus is already scheduled at this time' 
          },
          { status: 409 }
        );
      }
    }

    // Update schedule
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      params.id,
      validationResult.data,
      { new: true, runValidators: true }
    )
      .populate('routeId', 'name code')
      .populate('busId', 'registrationNumber capacity busType')
      .populate('driverId', 'profile.firstName profile.lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: { schedule: updatedSchedule },
    });
  } catch (error: any) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/:id - Delete schedule (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult || !hasRole(authResult, [UserRole.ADMIN])) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if schedule exists
    const schedule = await Schedule.findById(params.id);
    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Check if schedule has active bookings
    const futureBookings = await Booking.countDocuments({
      scheduleId: params.id,
      travelDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (futureBookings > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete schedule with ${futureBookings} active future booking(s). Cancel bookings first or deactivate schedule.` 
        },
        { status: 409 }
      );
    }

    // Soft delete by setting isActive to false
    await Schedule.findByIdAndUpdate(params.id, { isActive: false });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
