import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import mongoose from 'mongoose';

// PUT - Check out
export async function PUT(req: NextRequest) {
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

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      driverId: driver._id,
      date: today,
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'No check-in found for today. Please check in first.' },
        { status: 400 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { error: 'Already checked out today' },
        { status: 400 }
      );
    }

    // Update with check-out time
    attendance.checkOutTime = new Date();
    if (notes) {
      attendance.notes = attendance.notes 
        ? `${attendance.notes}\nCheckout: ${notes}`
        : notes;
    }
    await attendance.save();

    return NextResponse.json({
      success: true,
      message: 'Checked out successfully',
      data: attendance,
    });

  } catch (error: any) {
    console.error('Error checking out:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check out' },
      { status: 500 }
    );
  }
}
