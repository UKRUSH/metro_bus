import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Bus from '@/lib/models/Bus';
import { authenticateRequest } from '@/lib/auth';

const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(process.env.MONGODB_URI || '');
};

// POST /api/buses/[id]/approve - Approve or reject bus (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Approve API called');
    
    const auth = authenticateRequest(request);
    console.log('Auth result:', { userId: auth?.userId, role: auth?.role });
    
    if (!auth || auth.role !== 'admin') {
      console.error('Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    console.log('Database connected');
    
    const { id } = await params;
    console.log('Bus ID:', id);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      console.error('Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejectionReason) {
      console.error('Rejection reason missing');
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting' },
        { status: 400 }
      );
    }

    const bus = await Bus.findById(id);
    if (!bus) {
      console.error('Bus not found:', id);
      return NextResponse.json(
        { error: 'Bus not found' },
        { status: 404 }
      );
    }

    console.log('Bus found:', bus.registrationNumber);

    if (action === 'approve') {
      bus.approvalStatus = 'approved';
      bus.currentStatus = 'available';
      bus.approvedBy = new mongoose.Types.ObjectId(auth.userId);
      bus.approvedAt = new Date();
      bus.rejectionReason = undefined;
      console.log('Approving bus...');
    } else {
      bus.approvalStatus = 'rejected';
      bus.currentStatus = 'rejected';
      bus.rejectionReason = rejectionReason;
      console.log('Rejecting bus with reason:', rejectionReason);
    }

    await bus.save();
    console.log('Bus saved successfully');

    // Fetch the updated bus with proper population
    const populatedBus = await Bus.findById(id)
      .populate('ownerId', 'email profile')
      .populate('routeId', 'name code')
      .populate('driverId', 'email profile')
      .lean();

    console.log('Bus populated and ready to return');

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Bus approved successfully' : 'Bus rejected',
      data: { bus: populatedBus },
    });
  } catch (error: any) {
    console.error('Error processing bus approval:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: `Failed to process approval: ${error.message}` },
      { status: 500 }
    );
  }
}
