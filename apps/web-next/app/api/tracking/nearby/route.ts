import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusLocation from '@/lib/models/BusLocation';

// GET /api/tracking/nearby - Find nearby buses (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '5000'); // meters

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    const nearbyBuses = await (BusLocation as any).findNearby(lng, lat, radius);

    // Populate bus and route details
    const populated = await BusLocation.populate(nearbyBuses, [
      { path: 'busId', select: 'registrationNumber busType capacity facilities' },
      { path: 'routeId', select: 'routeName routeNumber' },
    ]);

    return NextResponse.json({
      success: true,
      buses: populated,
      count: populated.length,
      searchLocation: { latitude: lat, longitude: lng },
      radius,
    });
  } catch (error: any) {
    console.error('Error finding nearby buses:', error);
    return NextResponse.json(
      { error: 'Failed to find nearby buses' },
      { status: 500 }
    );
  }
}
