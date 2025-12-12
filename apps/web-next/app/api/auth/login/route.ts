import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { comparePassword, generateTokens } from '@/lib/auth';
import { loginSchema } from '@metro/shared';

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    
    // Connect to database
    await connectDB();
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is deactivated. Please contact support.',
        },
        { status: 403 }
      );
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    // Save refresh token and update last login
    user.refreshTokens.push(tokens.refreshToken);
    user.lastLogin = new Date();
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          isVerified: user.isVerified,
        },
        tokens,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
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
