import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/lib/models/Route';
import Schedule from '@/lib/models/Schedule';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { createRouteSchema, UserRole } from '@metro/shared';

// GET /api/routes - Search routes
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const isActiveParam = searchParams.get('isActive');

    const query: any = {};
    
    // Only filter by isActive if it's not 'all'
    if (isActiveParam !== 'all') {
      query.isActive = isActiveParam !== 'false';
    }

    // Search by origin and destination
    if (origin && destination) {
      query['stops.name'] = {
        $all: [
          new RegExp(origin, 'i'),
          new RegExp(destination, 'i'),
        ],
      };
    } else if (origin) {
      query['stops.name'] = new RegExp(origin, 'i');
    } else if (destination) {
      query['stops.name'] = new RegExp(destination, 'i');
    }

    const routes = await Route.find(query)
      .sort({ name: 1 })
      .lean();

    // If date is provided, get schedules for that day
    let routesWithSchedules = routes;
    if (date) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      routesWithSchedules = await Promise.all(
        routes.map(async (route) => {
          const schedules = await Schedule.find({
            routeId: route._id,
            isActive: true,
            days: dayOfWeek,
          })
            .populate('busId', 'registrationNumber capacity')
            .lean();

          return {
            ...route,
            schedules: schedules || [],
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        routes: routesWithSchedules,
        count: routesWithSchedules.length,
      },
    });
  } catch (error: any) {
    console.error('Search routes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/routes - Create new route (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    console.log('Auth result:', authResult);
    
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token' },
        { status: 401 }
      );
    }
    
    if (!hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    // Validate request body
    const validationResult = createRouteSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }
    
    console.log('Validation successful:', validationResult.data);

    // Check if route code already exists
    const existingRoute = await Route.findOne({ 
      code: validationResult.data.code.toUpperCase() 
    });
    
    if (existingRoute) {
      return NextResponse.json(
        { success: false, error: 'Route code already exists' },
        { status: 409 }
      );
    }

    // Sort stops by order
    const sortedStops = [...validationResult.data.stops].sort((a, b) => a.order - b.order);

    // Create route with explicit fields
    console.log('Creating route with origin:', validationResult.data.origin, 'destination:', validationResult.data.destination);
    
    const routeData = {
      name: validationResult.data.name,
      code: validationResult.data.code.toUpperCase(),
      origin: validationResult.data.origin,
      destination: validationResult.data.destination,
      stops: sortedStops,
      distance: validationResult.data.distance,
      estimatedDuration: validationResult.data.estimatedDuration,
      fare: validationResult.data.fare,
      isActive: validationResult.data.isActive ?? true,
      description: validationResult.data.description,
    };

    console.log('Route data to save:', JSON.stringify(routeData, null, 2));

    const route = await Route.create(routeData);

    console.log('✅ Route created in DB:', {
      _id: route._id,
      code: route.code,
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      hasOrigin: !!route.origin,
      hasDestination: !!route.destination
    });

    return NextResponse.json({
      success: true,
      data: { route },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
