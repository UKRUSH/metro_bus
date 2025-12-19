'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Assignment {
  _id: string;
  driverId: {
    _id: string;
    fullName: string;
    licenseNumber: string;
    mobileNumber: string;
  };
  busId: {
    _id: string;
    registrationNumber: string;
    busType: string;
    capacity: number;
  };
  routeId: {
    _id: string;
    name: string;
    origin: string;
    destination: string;
  };
  assignmentDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  requestedBy: 'driver' | 'admin';
  startTime?: string;
  endTime?: string;
  notes?: string;
  rejectionReason?: string;
  approvedBy?: any;
  requestedAt: string;
  createdAt: string;
}

export default function AdminScheduleAssignmentsPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated } = useAuth();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState('');
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchAssignments();
  }, [isAuthenticated, user, router, tokens, filterStatus, selectedDate]);

  const fetchAssignments = async () => {
    if (!tokens?.accessToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      let url = '/api/drivers/schedule-assignments?';
      if (filterStatus && filterStatus !== 'all') {
        url += `status=${filterStatus}&`;
      }
      if (selectedDate) {
        url += `date=${selectedDate}&`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (!response.ok) throw new Error('Failed to fetch assignments');

      const data = await response.json();
      setAssignments(data.data.assignments);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAssignment) return;
    
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/drivers/schedule-assignments/${selectedAssignment._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ action: 'approve' }),
        }
      );

      if (!response.ok) throw new Error('Failed to approve assignment');

      alert('Assignment approved successfully!');
      setShowApproveModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAssignment || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      setProcessing(true);
      const response = await fetch(
        `/api/drivers/schedule-assignments/${selectedAssignment._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ 
            action: 'reject',
            rejectionReason 
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to reject assignment');

      alert('Assignment rejected');
      setShowRejectModal(false);
      setSelectedAssignment(null);
      setRejectionReason('');
      fetchAssignments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getPendingCount = () => assignments.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Schedule Assignments</h1>
              <p className="text-gray-600 mt-1">
                Manage driver bus and route assignment requests
                {getPendingCount() > 0 && (
                  <span className="ml-2 text-yellow-600 font-semibold">
                    • {getPendingCount()} Pending Approval
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setSelectedDate('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Assignments List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No Assignments Found</h2>
            <p className="mt-2 text-gray-600">No driver schedule assignments match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {assignment.driverId.fullName}
                      </h3>
                      {getStatusBadge(assignment.status)}
                      {assignment.requestedBy === 'driver' && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                          DRIVER REQUEST
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      License: {assignment.driverId.licenseNumber} • {assignment.driverId.mobileNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-500">Assignment Date</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(assignment.assignmentDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-4 rounded-lg bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Bus</p>
                    <p className="font-bold text-gray-900">{assignment.busId.registrationNumber}</p>
                    <p className="text-sm text-gray-600">
                      {assignment.busId.busType} • {assignment.busId.capacity} seats
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-500">Route</p>
                    <p className="font-bold text-gray-900">{assignment.routeId.name}</p>
                    <p className="text-sm text-gray-600">
                      {assignment.routeId.origin} → {assignment.routeId.destination}
                    </p>
                  </div>
                </div>

                {assignment.notes && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-3">
                    <p className="text-sm font-semibold text-blue-700">Driver's Notes:</p>
                    <p className="text-sm text-blue-900">{assignment.notes}</p>
                  </div>
                )}

                {assignment.status === 'rejected' && assignment.rejectionReason && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{assignment.rejectionReason}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Requested: {new Date(assignment.requestedAt).toLocaleString()}</span>
                </div>

                {assignment.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowApproveModal(true);
                      }}
                      className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowRejectModal(true);
                      }}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approve Modal */}
      {showApproveModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Approve Assignment</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to approve this assignment for{' '}
              <strong>{selectedAssignment.driverId.fullName}</strong> on{' '}
              <strong>
                {new Date(selectedAssignment.assignmentDate).toLocaleDateString()}
              </strong>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedAssignment(null);
                }}
                disabled={processing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Reject Assignment</h3>
            <p className="mb-4 text-gray-600">
              Please provide a reason for rejecting this assignment:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Enter rejection reason..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedAssignment(null);
                  setRejectionReason('');
                }}
                disabled={processing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
