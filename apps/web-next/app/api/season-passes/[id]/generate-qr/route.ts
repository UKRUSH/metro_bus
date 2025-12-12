import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SeasonPass from '@/lib/models/SeasonPass';
import User from '@/lib/models/User';
import QRCode from 'qrcode';
import { requireAuth } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = requireAuth([UserRole.ADMIN, UserRole.OWNER, UserRole.PASSENGER])(request);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const params = await context.params;
    const passId = params.id;

    // Find season pass
    const seasonPass = await SeasonPass.findById(passId).populate('userId', 'email profile');
    if (!seasonPass) {
      return NextResponse.json({ error: 'Season pass not found' }, { status: 404 });
    }

    // Check if user owns this pass (or is admin)
    const isAdmin = authResult.user.role === UserRole.ADMIN || authResult.user.role === UserRole.OWNER;
    if (!isAdmin && seasonPass.userId.toString() !== authResult.user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate QR Code data
    const qrData = {
      passId: seasonPass._id.toString(),
      userId: seasonPass.userId._id ? seasonPass.userId._id.toString() : seasonPass.userId.toString(),
      passType: seasonPass.passType,
      startDate: seasonPass.startDate,
      endDate: seasonPass.endDate,
      status: seasonPass.status,
      routeId: seasonPass.routeId?.toString(),
      boardingStop: seasonPass.boardingStop,
      alightingStop: seasonPass.alightingStop,
      generatedAt: new Date().toISOString(),
    };

    // Generate QR code as Data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    console.log(`✅ QR Code generated for season pass ${passId}`);

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        qrData,
        passDetails: {
          id: seasonPass._id,
          passType: seasonPass.passType,
          status: seasonPass.status,
          startDate: seasonPass.startDate,
          endDate: seasonPass.endDate,
          usageCount: seasonPass.usageCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code', message: error.message },
      { status: 500 }
    );
  }
}
