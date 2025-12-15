'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  currentStatus: string;
  approvalStatus: string;
  rejectionReason?: string;
  chassisNumber?: string;
  engineNumber?: string;
  ownerId?: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: string;
}

export default function BusApprovalPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchPendingBuses();
  }, [authLoading, isAuthenticated, user, router]);

  const fetchPendingBuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buses?status=pending', {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch buses');

      const data = await response.json();
      setBuses(data.data.buses || []);
    } catch (err) {
      console.error('Error fetching buses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async () => {
    if (!selectedBus) return;
    
    if (modalAction === 'reject' && !rejectionReason.trim()) {
      setNotification({ type: 'error', message: 'Please provide a rejection reason' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/buses/${selectedBus._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          action: modalAction,
          rejectionReason: modalAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process request');
      }

      setNotification({
        type: 'success',
        message: `Bus ${modalAction === 'approve' ? 'approved' : 'rejected'} successfully!`
      });
      setTimeout(() => setNotification(null), 3000);

      setShowModal(false);
      setSelectedBus(null);
      setRejectionReason('');
      fetchPendingBuses();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to process request'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <button className="rounded-lg p-2 hover:bg-blue-50 transition-colors">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Approval</h1>
                <p className="text-sm text-gray-600">Review and approve pending buses</p>
              </div>
            </div>
            <div className="rounded-full bg-yellow-100 px-4 py-2">
              <span className="font-bold text-yellow-800">{buses.length} Pending</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : buses.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No pending buses</h3>
            <p className="mt-2 text-gray-600">All buses have been reviewed</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {buses.map((bus) => (
              <div key={bus._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{bus.registrationNumber}</h3>
                  <p className="text-sm text-gray-600">{bus.busType} • {bus.capacity} seats</p>
                </div>

                {bus.manufacturer && (
                  <div className="mb-3 pb-3 border-b">
                    <p className="text-sm text-gray-600">Manufacturer</p>
                    <p className="font-medium text-gray-900">{bus.manufacturer} {bus.busModel}</p>
                  </div>
                )}

                {bus.chassisNumber && (
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chassis:</span>
                      <span className="font-medium text-gray-900">{bus.chassisNumber}</span>
                    </div>
                    {bus.engineNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Engine:</span>
                        <span className="font-medium text-gray-900">{bus.engineNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {bus.ownerId && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs text-blue-600 font-semibold mb-1">Owner</p>
                    <p className="text-sm font-medium text-blue-900">
                      {bus.ownerId.profile?.firstName || bus.ownerId.email}
                    </p>
                    <p className="text-xs text-blue-700">{bus.ownerId.email}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedBus(bus);
                      setModalAction('approve');
                      setShowModal(true);
                    }}
                    className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBus(bus);
                      setModalAction('reject');
                      setShowModal(true);
                    }}
                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approval/Rejection Modal */}
      {showModal && selectedBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-full p-3 ${modalAction === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`h-6 w-6 ${modalAction === 'approve' ? 'text-green-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {modalAction === 'approve' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {modalAction === 'approve' ? 'Approve Bus' : 'Reject Bus'}
                </h3>
                <p className="text-sm text-gray-600">{selectedBus.registrationNumber}</p>
              </div>
            </div>

            {modalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
                  placeholder="Provide a detailed reason for rejection..."
                />
              </div>
            )}

            {modalAction === 'approve' && (
              <p className="text-gray-700 mb-6">
                This bus will be approved and set to <span className="font-bold text-green-600">Available</span> status.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBus(null);
                  setRejectionReason('');
                }}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReject}
                className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white transition-colors ${
                  modalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[300px] ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <span className="font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto hover:opacity-75">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
