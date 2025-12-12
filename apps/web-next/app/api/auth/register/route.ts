import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, generateTokens } from '@/lib/auth';
import { registerSchema } from '@metro/shared';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validationResult = registerSchema.safeParse(body);
    
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
    
    const { email, password, phone, firstName, lastName, role } = validationResult.data;
    
    // Connect to database
    await connectDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { 'profile.phone': phone }],
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email or phone already exists',
        },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const user = await User.create({
      email,
      passwordHash,
      role: role || 'passenger',
      profile: {
        firstName,
        lastName,
        phone,
      },
    });
    
    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    
    // Save refresh token
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
          },
          tokens,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
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
