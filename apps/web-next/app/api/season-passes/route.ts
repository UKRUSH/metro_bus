import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeasonPass from '@/lib/models/SeasonPass';
import Route from '@/lib/models/Route';
import { authenticateRequest } from '@/lib/auth/middleware';

// GET /api/season-passes - Get user's season passes
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: any = { userId: authResult.userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [passes, total] = await Promise.all([
      SeasonPass.find(query)
        .populate('routeId', 'name code fare')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SeasonPass.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        passes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching season passes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch season passes' },
      { status: 500 }
    );
  }
}

// POST /api/season-passes - Purchase a season pass
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { passType, routeId, paymentMethod, userId, status, autoRenew, startDate, endDate, price, paymentStatus, boardingStop, alightingStop } = body;

    // Check if admin is creating pass for another user
    const isAdmin = authResult.role === 'admin' || authResult.role === 'owner';
    const targetUserId = (userId && isAdmin) ? userId : authResult.userId;

    // Validate pass type
    if (!['monthly', 'quarterly', 'yearly'].includes(passType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pass type' },
        { status: 400 }
      );
    }

    // Calculate dates and price (allow admin to override)
    let calculatedStartDate = startDate ? new Date(startDate) : new Date();
    let calculatedEndDate: Date;
    let calculatedPrice: number;

    if (endDate && price !== undefined && isAdmin) {
      // Admin provided custom values
      calculatedEndDate = new Date(endDate);
      calculatedPrice = price;
    } else {
      // Calculate based on pass type
      calculatedEndDate = new Date(calculatedStartDate);
      let basePrice = 0;

      switch (passType) {
        case 'monthly':
          calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
          basePrice = 5000; // LKR 5,000 for monthly
          break;
        case 'quarterly':
          calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 3);
          basePrice = 13500; // LKR 13,500 for quarterly (10% discount)
          break;
        case 'yearly':
          calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);
          basePrice = 48000; // LKR 48,000 for yearly (20% discount)
          break;
      }

      // If route-specific, adjust price
      calculatedPrice = basePrice;
      if (routeId) {
        const route = await Route.findById(routeId);
        if (!route) {
          return NextResponse.json(
            { success: false, error: 'Route not found' },
            { status: 404 }
          );
        }
        // Route-specific passes are 30% of base price
        calculatedPrice = Math.round(basePrice * 0.3);
      }
    }

    // Create season pass
    const seasonPass = await SeasonPass.create({
      userId: targetUserId,
      passType,
      routeId: routeId || undefined,
      boardingStop: boardingStop || undefined,
      alightingStop: alightingStop || undefined,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
      price: calculatedPrice,
      status: (status && isAdmin) ? status : 'active',
      usageCount: 0,
      paymentStatus: (paymentStatus && isAdmin) ? paymentStatus : (paymentMethod ? 'completed' : 'pending'),
      paymentMethod: paymentMethod || (isAdmin ? 'admin' : undefined),
      autoRenew: autoRenew !== undefined ? autoRenew : false,
    });

    const populatedPass = await SeasonPass.findById(seasonPass._id).populate(
      'routeId',
      'name code fare'
    );

    return NextResponse.json({
      success: true,
      data: { seasonPass: populatedPass },
    });
  } catch (error) {
    console.error('Error creating season pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create season pass' },
      { status: 500 }
    );
  }
}
