import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SeasonPass from '@/lib/models/SeasonPass';
import { authenticateRequest } from '@/lib/auth/middleware';

// GET /api/season-passes/:id - Get season pass details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const params = await context.params;
    const { id } = params;
    const seasonPass = await SeasonPass.findById(id).populate(
      'routeId',
      'name code fare stops'
    );

    if (!seasonPass) {
      return NextResponse.json(
        { success: false, error: 'Season pass not found' },
        { status: 404 }
      );
    }

    // Check if user owns this pass or is admin
    const passUserId =
      typeof seasonPass.userId === 'object' && seasonPass.userId._id
        ? seasonPass.userId._id.toString()
        : seasonPass.userId.toString();

    if (
      passUserId !== authResult.userId &&
      authResult.role !== 'admin' &&
      authResult.role !== 'finance'
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { seasonPass },
    });
  } catch (error) {
    console.error('Error fetching season pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch season pass' },
      { status: 500 }
    );
  }
}

// PUT /api/season-passes/:id - Update season pass (toggle auto-renew, suspend)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const params = await context.params;
    const body = await request.json();
    const { action, autoRenew, status, endDate } = body;

    const seasonPass = await SeasonPass.findById(params.id);

    if (!seasonPass) {
      return NextResponse.json(
        { success: false, error: 'Season pass not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const passUserId =
      typeof seasonPass.userId === 'object' && seasonPass.userId._id
        ? seasonPass.userId._id.toString()
        : seasonPass.userId.toString();

    const isAdmin = authResult.role === 'admin' || authResult.role === 'owner';
    const isOwner = passUserId === authResult.userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Handle different actions
    if (action === 'suspend') {
      seasonPass.status = 'suspended';
    } else if (action === 'activate') {
      // Only activate if not expired
      const now = new Date();
      if (seasonPass.endDate >= now) {
        seasonPass.status = 'active';
      } else {
        return NextResponse.json(
          { success: false, error: 'Cannot activate expired pass' },
          { status: 400 }
        );
      }
    }
    
    // Admin can directly update status
    if (status !== undefined && isAdmin) {
      if (!['active', 'expired', 'suspended'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      seasonPass.status = status;
    }

    // Admin can extend end date
    if (endDate !== undefined && isAdmin) {
      const newEndDate = new Date(endDate);
      if (isNaN(newEndDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid end date' },
          { status: 400 }
        );
      }
      seasonPass.endDate = newEndDate;
    }

    // Both user and admin can toggle auto-renew
    if (autoRenew !== undefined) {
      seasonPass.autoRenew = autoRenew;
    }

    await seasonPass.save();

    const updatedPass = await SeasonPass.findById(seasonPass._id).populate(
      'routeId',
      'name code fare'
    );

    return NextResponse.json({
      success: true,
      data: { seasonPass: updatedPass },
    });
  } catch (error) {
    console.error('Error updating season pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update season pass' },
      { status: 500 }
    );
  }
}

// DELETE /api/season-passes/:id - Cancel season pass
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const params = await context.params;
    const seasonPass = await SeasonPass.findById(params.id);

    if (!seasonPass) {
      return NextResponse.json(
        { success: false, error: 'Season pass not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const passUserId =
      typeof seasonPass.userId === 'object' && seasonPass.userId._id
        ? seasonPass.userId._id.toString()
        : seasonPass.userId.toString();

    const isAdmin = authResult.role === 'admin' || authResult.role === 'owner';
    const isOwner = passUserId === authResult.userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Admin can hard delete, user can only suspend (cancel)
    if (isAdmin) {
      // Hard delete for admin
      await SeasonPass.findByIdAndDelete(params.id);
      return NextResponse.json({
        success: true,
        message: 'Season pass deleted successfully',
      });
    } else {
      // User can only cancel (suspend) their pass
      if (seasonPass.status === 'expired') {
        return NextResponse.json(
          { success: false, error: 'Cannot cancel expired pass' },
          { status: 400 }
        );
      }

      seasonPass.status = 'suspended';
      await seasonPass.save();

      return NextResponse.json({
        success: true,
        message: 'Season pass cancelled successfully',
      });
    }
  } catch (error) {
    console.error('Error cancelling season pass:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel season pass' },
      { status: 500 }
    );
  }
}
