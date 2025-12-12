import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Schedule from '@/lib/models/Schedule';
import { requireAuth } from '@/lib/auth';

// GET /api/schedules - List schedules with filters
export async function GET(request: NextRequest) {
  try {
    // Log the authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Schedules API - Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');
    
    // Authenticate user
    const auth = requireAuth();
    const authResult = auth(request);
    console.log('Schedules API - Auth result:', { 
      authorized: authResult.authorized, 
      userId: authResult.user?.userId,
      role: authResult.user?.role 
    });
    
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const routeId = searchParams.get('routeId');
    const busId = searchParams.get('busId');
    const isActive = searchParams.get('isActive');

    const query: any = {};

    // For drivers, filter by assigned schedules
    if (authResult.user.role === 'driver') {
      // TODO: Add driver assignment filtering when driver-bus assignment is implemented
      // For now, show all active schedules
      query.isActive = true;
    }

    if (day) {
      query.days = { $in: [day] };
    }

    if (routeId) {
      query.routeId = routeId;
    }

    if (busId) {
      query.busId = busId;
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    console.log('Fetching schedules with query:', query);

    const schedules = await Schedule.find(query)
      .populate('routeId', 'name code origin destination distance')
      .populate('busId', 'registrationNumber busType capacity facilities')
      .sort({ departureTime: 1 })
      .lean();

    console.log(`Found ${schedules.length} schedules`);

    return NextResponse.json({
      success: true,
      schedules,
      count: schedules.length,
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create a new schedule (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, ['admin']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { routeId, busId, departureTime, arrivalTime, days, frequency, isActive } = body;

    // Validate required fields
    if (!routeId || !busId || !departureTime || !arrivalTime || !days || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const schedule = await Schedule.create({
      routeId,
      busId,
      departureTime,
      arrivalTime,
      days,
      frequency,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('routeId', 'name code origin destination')
      .populate('busId', 'registrationNumber busType');

    return NextResponse.json({
      success: true,
      schedule: populatedSchedule,
      message: 'Schedule created successfully',
    });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
