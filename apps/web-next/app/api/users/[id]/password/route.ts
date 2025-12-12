import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth/middleware';
import { hashPassword, comparePassword } from '@/lib/auth/password';
import { changePasswordSchema } from '@metro/shared';

// PUT /api/users/:id/password - Change password
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only change their own password
    if (authResult.userId !== params.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { currentPassword, newPassword } = validation.data;

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.passwordHash = hashedPassword;

    // Clear refresh tokens to force re-login on all devices
    user.refreshTokens = [];

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
