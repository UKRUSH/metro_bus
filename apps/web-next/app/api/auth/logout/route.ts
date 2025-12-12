import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { authenticateRequest } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user by removing refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;
    
    // Authenticate user
    const user = authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Remove refresh token from user
    if (refreshToken) {
      await User.findByIdAndUpdate(user.userId, {
        $pull: { refreshTokens: refreshToken },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
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
