import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import mongoose from 'mongoose';

// GET - Get today's attendance status
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

    // Find today's attendance
    const attendance = await Attendance.findOne({
      driverId: driver._id,
      date: today,
    });

    return NextResponse.json({
      success: true,
      data: attendance,
    });

  } catch (error: any) {
    console.error('Error fetching today\'s attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance status' },
      { status: 500 }
    );
  }
}
