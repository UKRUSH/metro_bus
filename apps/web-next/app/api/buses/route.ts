import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Bus from '@/lib/models/Bus';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole, createBusSchema } from '@metro/shared';
import mongoose from 'mongoose';

// GET /api/buses - List all buses with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const busType = searchParams.get('busType');
    const ownerId = searchParams.get('ownerId');
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const routeId = searchParams.get('routeId');
    const publicAccess = searchParams.get('public') === 'true';

    const query: any = {};

    // Check authentication - optional for public tracking
    const authResult = authenticateRequest(request);
    
    if (!publicAccess && !authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Admin and Owner can access full bus list (non-public)
    if (!publicAccess && authResult && !hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Owner access required' },
        { status: 403 }
      );
    }

    // If user is Owner, only show their buses
    if (authResult && authResult.role === UserRole.OWNER) {
      // Convert string userId to ObjectId for MongoDB query
      query.ownerId = new mongoose.Types.ObjectId(authResult.userId);
      console.log('Owner fetching buses:', {
        userId: authResult.userId,
        ownerIdQuery: query.ownerId,
        role: authResult.role,
        email: authResult.email
      });
    } else if (ownerId && !publicAccess) {
      // Admin can filter by owner
      query.ownerId = new mongoose.Types.ObjectId(ownerId);
    }

    // Public access: only show in-service buses
    if (publicAccess) {
      query.currentStatus = 'in-service';
      query.isActive = true;
    }

    if (status) {
      query.currentStatus = status;
    }

    if (busType) {
      query.busType = busType;
    }

    if (routeId) {
      query.routeId = new mongoose.Types.ObjectId(routeId);
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { busModel: { $regex: search, $options: 'i' } },
      ];
    }

    console.log('Bus query:', JSON.stringify(query));

    const skip = (page - 1) * limit;

    const [buses, total] = await Promise.all([
      Bus.find(query)
        .populate('ownerId', 'email profile')
        .populate('driverId', 'email profile')
        .populate('routeId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Bus.countDocuments(query),
    ]);

    console.log(`Found ${buses.length} buses for query:`, query);
    if (buses.length > 0) {
      console.log('Sample bus ownerId:', buses[0].ownerId);
    }

    return NextResponse.json({
      success: true,
      data: {
        buses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching buses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch buses' },
      { status: 500 }
    );
  }
}

// POST /api/buses - Create new bus
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Admin and Owner can create buses
    if (!hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Owner access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();

    // Validate input
    const validationResult = createBusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If user is Owner, set ownerId to their ID (unless admin is creating for someone)
    if (authResult.role === UserRole.OWNER && !data.ownerId) {
      data.ownerId = authResult.userId;
    }

    // Convert ownerId to ObjectId if present
    if (data.ownerId) {
      data.ownerId = new mongoose.Types.ObjectId(data.ownerId) as any;
    }

    // Check if registration number already exists
    const existingBus = await Bus.findOne({
      registrationNumber: data.registrationNumber,
    });

    if (existingBus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bus with this registration number already exists',
        },
        { status: 409 }
      );
    }

    // Create bus
    const bus = await Bus.create(data);

    const populatedBus = await Bus.findById(bus._id)
      .populate('routeId', 'name code')
      .populate('driverId', 'email profile');

    return NextResponse.json(
      {
        success: true,
        data: { bus: populatedBus },
        message: 'Bus created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating bus:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Bus with this registration number already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create bus' },
      { status: 500 }
    );
  }
}
