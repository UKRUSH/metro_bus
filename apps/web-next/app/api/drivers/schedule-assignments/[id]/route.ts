import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DriverScheduleAssignment from '@/lib/models/DriverScheduleAssignment';
import { authenticateRequest, hasRole } from '@/lib/auth/middleware';
import { UserRole } from '@metro/shared';

/**
 * PATCH /api/drivers/schedule-assignments/[id]
 * Approve, reject, or update a schedule assignment
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Only admins can manage assignments' }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const assignment = await DriverScheduleAssignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Handle approval
    if (body.action === 'approve') {
      if (assignment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending assignments can be approved' },
          { status: 400 }
        );
      }

      assignment.status = 'approved';
      assignment.approvedBy = user.id;
      assignment.approvedAt = new Date();
      await assignment.save();

      const populatedAssignment = await DriverScheduleAssignment.findById(assignment._id)
        .populate('driverId', 'fullName licenseNumber mobileNumber')
        .populate('busId', 'registrationNumber busType capacity')
        .populate('routeId', 'name origin destination')
        .populate('approvedBy', 'profile.firstName profile.lastName')
        .lean();

      return NextResponse.json({
        success: true,
        data: { assignment: populatedAssignment },
        message: 'Assignment approved successfully',
      });
    }

    // Handle rejection
    if (body.action === 'reject') {
      if (assignment.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending assignments can be rejected' },
          { status: 400 }
        );
      }

      if (!body.rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      assignment.status = 'rejected';
      assignment.rejectedBy = user.id;
      assignment.rejectedAt = new Date();
      assignment.rejectionReason = body.rejectionReason;
      await assignment.save();

      const populatedAssignment = await DriverScheduleAssignment.findById(assignment._id)
        .populate('driverId', 'fullName licenseNumber mobileNumber')
        .populate('busId', 'registrationNumber busType capacity')
        .populate('routeId', 'name origin destination')
        .lean();

      return NextResponse.json({
        success: true,
        data: { assignment: populatedAssignment },
        message: 'Assignment rejected',
      });
    }

    // Handle status update
    if (body.status) {
      assignment.status = body.status;
      await assignment.save();

      const populatedAssignment = await DriverScheduleAssignment.findById(assignment._id)
        .populate('driverId', 'fullName licenseNumber mobileNumber')
        .populate('busId', 'registrationNumber busType capacity')
        .populate('routeId', 'name origin destination')
        .lean();

      return NextResponse.json({
        success: true,
        data: { assignment: populatedAssignment },
        message: 'Assignment updated successfully',
      });
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drivers/schedule-assignments/[id]
 * Delete a schedule assignment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRole(user, [UserRole.ADMIN])) {
      return NextResponse.json({ error: 'Only admins can delete assignments' }, { status: 403 });
    }

    await connectDB();

    const assignment = await DriverScheduleAssignment.findById(params.id);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only allow deletion of pending or rejected assignments
    if (assignment.status === 'active' || assignment.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete active or completed assignments' },
        { status: 400 }
      );
    }

    await DriverScheduleAssignment.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
