import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeasonPass from '@/lib/models/SeasonPass';
import SeasonPassUsage from '@/lib/models/SeasonPassUsage';
import { requireAuth } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth([UserRole.ADMIN, UserRole.OWNER, UserRole.DRIVER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
    }

    // Parse QR data
    let passInfo;
    try {
      passInfo = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
    }

    const { passId, userId } = passInfo;

    if (!passId) {
      return NextResponse.json({ error: 'Invalid QR code - missing pass ID' }, { status: 400 });
    }

    // Find season pass
    const seasonPass = await SeasonPass.findById(passId)
      .populate('userId', 'email profile')
      .populate('routeId', 'name code');

    if (!seasonPass) {
      return NextResponse.json({ 
        success: false,
        error: 'Season pass not found',
        valid: false,
      }, { status: 404 });
    }

    // Verify the pass
    const now = new Date();
    const validations = {
      exists: true,
      isActive: seasonPass.status === 'active',
      notExpired: now >= new Date(seasonPass.startDate) && now <= new Date(seasonPass.endDate),
      paymentCompleted: seasonPass.paymentStatus === 'completed',
      userMatches: seasonPass.userId._id ? 
        seasonPass.userId._id.toString() === userId : 
        seasonPass.userId.toString() === userId,
    };

    const isValid = Object.values(validations).every(v => v === true);

    // Log usage if valid
    if (isValid) {
      // Increment usage count
      seasonPass.usageCount = (seasonPass.usageCount || 0) + 1;
      await seasonPass.save();

      // Create usage log
      await SeasonPassUsage.create({
        seasonPassId: seasonPass._id,
        userId: seasonPass.userId,
        routeId: seasonPass.routeId,
        usedAt: new Date(),
        scannedBy: authResult.user.userId,
        location: body.location || undefined,
      });

      console.log(`✅ Season pass ${passId} scanned successfully. Usage count: ${seasonPass.usageCount}`);
    }

    return NextResponse.json({
      success: true,
      valid: isValid,
      validations,
      data: {
        pass: {
          id: seasonPass._id,
          passType: seasonPass.passType,
          status: seasonPass.status,
          startDate: seasonPass.startDate,
          endDate: seasonPass.endDate,
          usageCount: seasonPass.usageCount,
          paymentStatus: seasonPass.paymentStatus,
        },
        passenger: {
          name: seasonPass.userId.profile ? 
            `${seasonPass.userId.profile.firstName || ''} ${seasonPass.userId.profile.lastName || ''}`.trim() :
            'Unknown',
          email: seasonPass.userId.email,
        },
        route: seasonPass.routeId ? {
          name: seasonPass.routeId.name,
          code: seasonPass.routeId.code,
        } : null,
        boardingStop: seasonPass.boardingStop,
        alightingStop: seasonPass.alightingStop,
      },
      message: isValid ? 'Season pass is valid' : 'Season pass is invalid',
      issues: Object.entries(validations)
        .filter(([_, value]) => !value)
        .map(([key]) => key),
    });
  } catch (error: any) {
    console.error('Error scanning season pass:', error);
    return NextResponse.json(
      { 
        success: false,
        valid: false,
        error: 'Failed to scan season pass',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
