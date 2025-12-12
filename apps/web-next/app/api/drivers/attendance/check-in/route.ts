import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';
import { checkInSchema } from '@metro/shared/validation';

/**
 * POST /api/drivers/attendance/check-in
 * Clock in for the day
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
    
    // For drivers, use their own profile; admins can check in for others
    let driverId = body.driverId;
    if (hasRole(authResult, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      driverId = driver._id.toString();
    }

    await connectDB();

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      driverId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already checked in today', attendance: existingAttendance },
        { status: 400 }
      );
    }

    // Create attendance record
    const checkInTime = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(8, 0, 0, 0); // Assuming 8 AM is scheduled time

    // Determine status based on check-in time
    let status: 'present' | 'late' = 'present';
    if (checkInTime > scheduledTime) {
      const lateMinutes = (checkInTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      if (lateMinutes > 15) { // More than 15 minutes late
        status = 'late';
      }
    }

    const attendance = await Attendance.create({
      driverId,
      date: today,
      checkInTime,
      status,
      notes: body.notes,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('driverId', 'userId documents.licenseNumber status');

    return NextResponse.json(
      { 
        message: 'Checked in successfully',
        attendance: populatedAttendance,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to check in', details: error.message },
      { status: 500 }
    );
  }
}
