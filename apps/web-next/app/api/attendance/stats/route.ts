import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import mongoose from 'mongoose';

// GET - Get attendance statistics
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

    // Build date range
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = month.split('-');
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
    } else {
      // Current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Get all attendance records for the period
    const records = await Attendance.find({
      driverId: driver._id,
      date: { $gte: startDate, $lte: endDate },
    });

    // Calculate statistics
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const onLeaveDays = records.filter(r => r.status === 'on_leave').length;
    
    // Calculate total hours worked
    let totalHours = 0;
    records.forEach(record => {
      if (record.checkInTime && record.checkOutTime) {
        const hours = (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    // Calculate working days in month
    const workingDaysInMonth = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const attendanceRate = workingDaysInMonth > 0 
      ? ((totalDays / workingDaysInMonth) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        totalDays,
        presentDays,
        lateDays,
        onLeaveDays,
        totalHours: totalHours.toFixed(2),
        attendanceRate,
        workingDaysInMonth,
        period: {
          start: startDate,
          end: endDate,
        },
      },
    });

  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
