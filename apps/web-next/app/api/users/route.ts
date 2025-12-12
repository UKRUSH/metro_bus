import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';
import { UserRole } from '@metro/shared';

/**
 * GET /api/users
 * Get all users (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const auth = requireAuth([UserRole.ADMIN, UserRole.FINANCE])(request);
    
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        { status: auth.user ? 403 : 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    // Connect to database
    await connectDB();
    
    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.phone': { $regex: search, $options: 'i' } },
      ];
    }
    
    // Get users with pagination
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
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
