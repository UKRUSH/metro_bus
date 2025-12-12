import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Route from '@/lib/models/Route';
import Schedule from '@/lib/models/Schedule';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { updateRouteSchema, UserRole } from '@metro/shared';

// GET /api/routes/:id - Get route details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const params = await context.params;
    const route = await Route.findById(params.id).lean();

    if (!route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    // Get all schedules for this route
    const schedules = await Schedule.find({
      routeId: params.id,
      isActive: true,
    })
      .populate('busId', 'registrationNumber capacity')
      .populate('driverId', 'profile.firstName profile.lastName')
      .sort({ departureTime: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        route: {
          ...route,
          schedules,
        },
      },
    });
  } catch (error: any) {
    console.error('Get route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/routes/:id - Update route (Admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const authResult = authenticateRequest(request);
    console.log('UPDATE auth result:', authResult);
    
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token' },
        { status: 401 }
      );
    }
    
    if (!hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Owner access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    console.log('UPDATE - Received body:', JSON.stringify(body, null, 2));
    
    // Validate request body
    const validationResult = updateRouteSchema.safeParse(body);
    console.log('UPDATE - Validation result:', validationResult.success);
    
    if (!validationResult.success) {
      console.error('UPDATE - Validation errors:', validationResult.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Check if route exists
    const existingRoute = await Route.findById(params.id);
    if (!existingRoute) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it conflicts
    if (validationResult.data.code) {
      const codeConflict = await Route.findOne({
        code: validationResult.data.code.toUpperCase(),
        _id: { $ne: params.id },
      });
      
      if (codeConflict) {
        return NextResponse.json(
          { success: false, error: 'Route code already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data with explicit fields
    const updateData: any = {};
    
    if (validationResult.data.name !== undefined) updateData.name = validationResult.data.name;
    if (validationResult.data.code !== undefined) updateData.code = validationResult.data.code.toUpperCase();
    if (validationResult.data.origin !== undefined) updateData.origin = validationResult.data.origin;
    if (validationResult.data.destination !== undefined) updateData.destination = validationResult.data.destination;
    if (validationResult.data.distance !== undefined) updateData.distance = validationResult.data.distance;
    if (validationResult.data.estimatedDuration !== undefined) updateData.estimatedDuration = validationResult.data.estimatedDuration;
    if (validationResult.data.fare !== undefined) updateData.fare = validationResult.data.fare;
    if (validationResult.data.isActive !== undefined) updateData.isActive = validationResult.data.isActive;
    if (validationResult.data.description !== undefined) updateData.description = validationResult.data.description;
    
    if (validationResult.data.stops) {
      updateData.stops = [...validationResult.data.stops].sort((a: any, b: any) => a.order - b.order);
    }

    console.log('Updating route with data:', updateData);

    // Update route
    const updatedRoute = await Route.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    console.log('Route updated successfully:', updatedRoute?._id, 'Origin:', updatedRoute?.origin, 'Destination:', updatedRoute?.destination);

    return NextResponse.json({
      success: true,
      data: { route: updatedRoute },
    });
  } catch (error: any) {
    console.error('Update route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/routes/:id - Delete route (Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    console.log('DELETE auth result:', authResult);
    
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token' },
        { status: 401 }
      );
    }
    
    if (!hasRole(authResult, [UserRole.ADMIN, UserRole.OWNER])) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin or Owner access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const params = await context.params;
    console.log('Deleting route with ID:', params.id);
    console.log('ID type:', typeof params.id, 'Length:', params.id.length);

    // Validate MongoDB ObjectId format
    if (!params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format');
      return NextResponse.json(
        { success: false, error: 'Invalid route ID format' },
        { status: 400 }
      );
    }

    // Check if route exists (including inactive ones)
    const route = await Route.findById(params.id);
    console.log('Found route:', route ? `${route.name} (${route.code}) - isActive: ${route.isActive}` : 'null');
    
    if (!route) {
      return NextResponse.json(
        { success: false, error: `Route not found with ID: ${params.id}` },
        { status: 404 }
      );
    }

    // Check if route has active schedules
    const activeSchedules = await Schedule.countDocuments({
      routeId: params.id,
      isActive: true,
    });

    if (activeSchedules > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete route with active schedules. Deactivate schedules first or deactivate the route instead.' 
        },
        { status: 409 }
      );
    }

    // Permanently delete the route
    await Route.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Route permanently deleted',
    });
  } catch (error: any) {
    console.error('Delete route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
