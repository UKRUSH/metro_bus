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
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const bus = await Bus.findById(params.id)
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
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const { action, location, speed, heading, ...updates } = body;

    const bus = await Bus.findById(params.id);
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

      const updatedBus = await Bus.findById(params.id)
        .populate('routeId', 'name code')
        .populate('driverId', 'email profile');

      return NextResponse.json({
        success: true,
        data: { bus: updatedBus },
        message: 'Location updated successfully',
      });
    }

    // General update (admin/operator only)
    if (['admin', 'operator'].includes(auth.role)) {
      Object.assign(bus, updates);
      await bus.save();

      const updatedBus = await Bus.findById(params.id)
        .populate('routeId', 'name code')
        .populate('driverId', 'email profile');

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

// DELETE /api/buses/[id] - Delete bus (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await dbConnect();

    const bus = await Bus.findByIdAndDelete(params.id);
    if (!bus) {
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting bus:', error);
    return NextResponse.json(
      { error: 'Failed to delete bus' },
      { status: 500 }
    );
  }
}
