import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Bus from '@/lib/models/Bus';
import { authenticateRequest } from '@/lib/auth';
import { broadcastBusLocation } from '@/lib/socket';

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(process.env.MONGODB_URI || '');
};

// GET /api/buses/[id] - Get bus details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const bus = await Bus.findById(id)
      .populate('routeId', 'name code stops fare')
      .populate('driverId', 'email profile');

    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { bus },
    });
  } catch (error) {
    console.error('Error fetching bus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus' },
      { status: 500 }
    );
  }
}

// PUT /api/buses/[id] - Update bus or location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Debug: Log authorization header
    const authHeader = request.headers.get('authorization');
    console.log('PUT /api/buses/[id] - Auth header:', authHeader ? 'Present' : 'Missing');
    
    const auth = authenticateRequest(request);
    console.log('PUT /api/buses/[id] - Auth result:', auth ? `User: ${auth.userId}, Role: ${auth.role}` : 'NULL');
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { action, location, speed, heading, ...updates } = body;

    const bus = await Bus.findById(id);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Location update (driver only)
    if (action === 'update_location' && location) {
      if (auth.role !== 'driver') {
        return NextResponse.json(
          { error: 'Only drivers can update bus location' },
          { status: 403 }
        );
      }

      await bus.updateLocation(
        location.lng || location.longitude,
        location.lat || location.latitude,
        speed,
        heading
      );

      // Broadcast to Socket.IO clients
      broadcastBusLocation(
        bus._id.toString(),
        bus.routeId?.toString(),
        { lat: location.lat || location.latitude, lng: location.lng || location.longitude },
        speed,
        heading
      );

      const updatedBus = await Bus.findById(id)
        .populate('routeId', 'name code')
        .populate('driverId', 'email profile');

      return NextResponse.json({
        success: true,
        data: { bus: updatedBus },
        message: 'Location updated successfully',
      });
    }

    // General update (admin/operator/owner)
    if (['admin', 'operator'].includes(auth.role)) {
      // Admin and operator can update any bus
      Object.assign(bus, updates);
      await bus.save();

      const updatedBus = await Bus.findById(id)
        .populate('routeId', 'name code')
        .populate('driverId', 'email profile')
        .populate('ownerId', 'email profile');

      return NextResponse.json({
        success: true,
        data: { bus: updatedBus },
        message: 'Bus updated successfully',
      });
    } else if (auth.role === 'owner') {
      // Owner can only update their own buses
      if (bus.ownerId?.toString() !== auth.userId) {
        return NextResponse.json(
          { error: 'You can only update your own buses' },
          { status: 403 }
        );
      }

      Object.assign(bus, updates);
      await bus.save();

      const updatedBus = await Bus.findById(id)
        .populate('routeId', 'name code')
        .populate('driverId', 'email profile')
        .populate('ownerId', 'email profile');

      return NextResponse.json({
        success: true,
        data: { bus: updatedBus },
        message: 'Bus updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Unauthorized to update bus' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error updating bus:', error);
    return NextResponse.json(
      { error: 'Failed to update bus' },
      { status: 500 }
    );
  }
}

// PATCH /api/buses/[id] - Partial update (e.g., route assignment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin and operators can assign routes
    if (!['admin', 'operator'].includes(auth.role)) {
      return NextResponse.json(
        { error: 'Only admin and operators can assign routes' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const bus = await Bus.findById(id);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Update route assignment
    if ('routeId' in body) {
      bus.routeId = body.routeId || null;
      await bus.save();
    }

    const updatedBus = await Bus.findById(id)
      .populate('routeId', 'name code origin destination')
      .populate('driverId', 'email profile')
      .populate('ownerId', 'email profile');

    return NextResponse.json({
      success: true,
      data: { bus: updatedBus },
      message: 'Route assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning route:', error);
    return NextResponse.json(
      { error: 'Failed to assign route' },
      { status: 500 }
    );
  }
}

// DELETE /api/buses/[id] - Delete bus (Admin/Owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const bus = await Bus.findById(id);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    // Admin can delete any bus, owner can only delete their own
    if (auth.role === 'admin' || (auth.role === 'owner' && bus.ownerId?.toString() === auth.userId)) {
      await Bus.findByIdAndDelete(id);
      
      return NextResponse.json({
        success: true,
        message: 'Bus deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Unauthorized. You can only delete your own buses.' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error deleting bus:', error);
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    );
  }
}
