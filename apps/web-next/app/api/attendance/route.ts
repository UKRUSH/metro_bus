import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import mongoose from 'mongoose';

// GET - Fetch attendance records for the driver
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const authResult = authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '30');

    // Find driver by userId - try both string and ObjectId
    let driver = await Driver.findOne({ userId: authResult.userId });
    
    // If not found, try with ObjectId conversion
    if (!driver && mongoose.Types.ObjectId.isValid(authResult.userId)) {
      driver = await Driver.findOne({ userId: new mongoose.Types.ObjectId(authResult.userId) });
    }
    
    if (!driver) {
      console.error('Driver profile not found for userId:', authResult.userId);
      return NextResponse.json(
        { error: 'Driver profile not found. Please create your driver profile first.' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = { driverId: driver._id };
    
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
    });

  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance records' },
      { status: 500 }
    );
  }
}

// POST - Check in
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const authResult = authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notes } = body;

    // Find driver by userId - try both string and ObjectId
    let driver = await Driver.findOne({ userId: authResult.userId });
    
    // If not found, try with ObjectId conversion
    if (!driver && mongoose.Types.ObjectId.isValid(authResult.userId)) {
      driver = await Driver.findOne({ userId: new mongoose.Types.ObjectId(authResult.userId) });
    }
    
    if (!driver) {
      console.error('Driver profile not found for userId:', authResult.userId);
      return NextResponse.json(
        { error: 'Driver profile not found. Please create your driver profile first.' },
        { status: 404 }
      );
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      driverId: driver._id,
      date: today,
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      );
    }

    const now = new Date();
    const checkInTime = now;
    
    // Determine if late (after 9 AM)
    const expectedCheckInTime = new Date(today);
    expectedCheckInTime.setHours(9, 0, 0, 0);
    const isLate = checkInTime > expectedCheckInTime;

    // Create attendance record
    const attendance = await Attendance.create({
      driverId: driver._id,
      date: today,
      checkInTime: checkInTime,
      status: isLate ? 'late' : 'present',
      notes: notes || undefined,
    });

    return NextResponse.json({
      success: true,
      message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
      data: attendance,
    });

  } catch (error: any) {
    console.error('Error checking in:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Attendance already recorded for today' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to check in' },
      { status: 500 }
    );
  }
}
