import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * POST /api/drivers/attendance/check-out
 * Clock out for the day
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
    
    // For drivers, use their own profile; admins can check out for others
    let driverId = body.driverId;
    if (hasRole(authResult, [UserRole.DRIVER])) {
      const driver = await Driver.findOne({ userId: authResult.user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      driverId = driver._id.toString();
    }

    await connectDB();

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      driverId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No check-in record found for today' },
        { status: 404 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: 'Already checked out today', attendance },
        { status: 400 }
      );
    }

    // Update with check-out time
    attendance.checkOutTime = new Date();
    if (body.notes) {
      attendance.notes = attendance.notes 
        ? `${attendance.notes}\nCheck-out: ${body.notes}`
        : body.notes;
    }
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('driverId', 'userId documents.licenseNumber status');

    return NextResponse.json({
      message: 'Checked out successfully',
      attendance: populatedAttendance,
    });
  } catch (error: any) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Failed to check out', details: error.message },
      { status: 500 }
    );
  }
}
