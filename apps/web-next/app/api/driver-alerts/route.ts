import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverAlert from '@/lib/models/DriverAlert';
import mongoose from 'mongoose';

interface DriverAlertRequest {
  driverId: string;
  alertType: 'warning' | 'alarm' | 'sleeping' | 'tension';
  timestamp: Date;
  driverState: string;
  eyeClosedDuration?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  tripId?: string;
  busId?: string;
  routeId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DriverAlertRequest = await request.json();

    // Validate required fields
    if (!body.driverId || !body.alertType || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Map alert types to model enums
    const alertTypeMap: Record<string, string> = {
      warning: 'drowsiness_warning',
      alarm: 'drowsiness_critical',
      sleeping: 'sleeping_detected',
      tension: 'tension_detected',
    };

    // Map driver state to mood state
    const moodStateMap: Record<string, string> = {
      Active: 'active',
      Tension: 'tension',
      Sleeping: 'sleeping',
    };

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (body.alertType === 'alarm' || body.alertType === 'sleeping') {
      severity = 'critical';
    } else if (body.alertType === 'tension') {
      severity = 'high';
    } else if (body.alertType === 'warning') {
      severity = 'medium';
    }

    // Create alert document
    const alertData = {
      driverId: new mongoose.Types.ObjectId(body.driverId),
      alertType: alertTypeMap[body.alertType] || 'drowsiness_warning',
      severity,
      moodState: moodStateMap[body.driverState] || 'active',
      timestamp: new Date(body.timestamp),
      eyeClosedDuration: body.eyeClosedDuration,
      location: body.location,
      tripId: body.tripId ? new mongoose.Types.ObjectId(body.tripId) : undefined,
      busId: body.busId ? new mongoose.Types.ObjectId(body.busId) : undefined,
      routeId: body.routeId ? new mongoose.Types.ObjectId(body.routeId) : undefined,
      resolved: false,
    };

    // Save to database
    const alert = await DriverAlert.create(alertData);

    return NextResponse.json(
      {
        success: true,
        alertId: alert._id.toString(),
        message: 'Alert saved successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving driver alert:', error);
    return NextResponse.json(
      { error: 'Failed to save alert', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const alertType = searchParams.get('alertType');

    // Connect to MongoDB
    await connectDB();

    // Build query
    const query: any = {};
    if (driverId) {
      query.driverId = new mongoose.Types.ObjectId(driverId);
    }
    if (alertType) {
      query.alertType = alertType;
    }

    // Fetch alerts
    const alerts = await DriverAlert
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('driverId', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching driver alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
