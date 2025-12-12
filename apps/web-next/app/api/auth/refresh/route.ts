import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token is required',
        },
        { status: 400 }
      );
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Find user and check if refresh token exists
    const user = await User.findOne({
      _id: decoded.userId,
      refreshTokens: refreshToken,
    });
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid refresh token',
        },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is deactivated',
        },
        { status: 403 }
      );
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
      },
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
