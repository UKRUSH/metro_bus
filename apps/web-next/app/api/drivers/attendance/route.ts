import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/lib/models/Attendance';
import Driver from '@/lib/models/Driver';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * GET /api/drivers/attendance
 * Get attendance records with filters
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const { searchParams } = new URL(req.url);

    // Build query
    const query: any = {};

    // Role-based filtering
    if (hasRole(authResult, [UserRole.DRIVER])) {
      // Drivers can only see their own attendance
      const driver = await Driver.findOne({ userId: user.id });
      if (!driver) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }
      query.driverId = driver._id;
    } else if (searchParams.get('driverId')) {
      query.driverId = searchParams.get('driverId');
    }

    // Date filters
    if (searchParams.get('startDate')) {
      query.date = { ...query.date, $gte: new Date(searchParams.get('startDate')!) };
    }
    if (searchParams.get('endDate')) {
      query.date = { ...query.date, $lte: new Date(searchParams.get('endDate')!) };
    }
    
    // Status filter
    if (searchParams.get('status')) {
      query.status = searchParams.get('status');
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    await connectDB();

    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .sort({ date: -1, checkInTime: -1 })
        .skip(skip)
        .limit(limit)
        .populate('driverId', 'userId documents.licenseNumber status')
        .lean(),
      Attendance.countDocuments(query),
    ]);

    return NextResponse.json({
      attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance records', details: error.message },
      { status: 500 }
    );
  }
}
