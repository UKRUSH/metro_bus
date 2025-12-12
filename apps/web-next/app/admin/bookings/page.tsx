'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface Route {
  _id: string;
  name: string;
  code: string;
  origin: string;
  destination: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
}

interface Booking {
  _id: string;
  userId: User | string;
  scheduleId: string;
  routeId: Route | string;
  busId: Bus | string;
  seatNumber: string;
  bookingDate: string;
  travelDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingsManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    console.log('Auth check - isAuthenticated:', isAuthenticated);
    console.log('User:', user);
    console.log('User role:', user?.role);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Allow ADMIN, OWNER, and admin roles
    const allowedRoles = ['ADMIN', 'OWNER', 'admin', 'owner'];
    if (user && !allowedRoles.includes(user.role)) {
      console.log('Access denied. User role:', user.role, 'Allowed roles:', allowedRoles);
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchBookings();
  }, [isAuthenticated, user, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const result = await response.json();
      console.log('Fetched bookings:', result);
      
      const bookingsData = result.data?.bookings || result.bookings || [];
      setBookings(bookingsData);
    } catch (err: any) {
      console.error('Fetch bookings error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the booking status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      alert(`Booking status updated to ${newStatus}`);
      await fetchBookings();
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId: string, newPaymentStatus: string) => {
    if (!confirm(`Are you sure you want to change the payment status to ${newPaymentStatus}?`)) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }

      alert(`Payment status updated to ${newPaymentStatus}`);
      await fetchBookings();
    } catch (err: any) {
      console.error('Update payment status error:', err);
      alert('Error: ' + err.message);
    }
  };

  const getUserName = (booking: Booking): string => {
    if (typeof booking.userId === 'object' && booking.userId) {
      const { firstName, lastName } = booking.userId.profile || {};
      return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  };

  const getRouteName = (booking: Booking): string => {
    if (typeof booking.routeId === 'object' && booking.routeId) {
      return `${booking.routeId.name} (${booking.routeId.code})`;
    }
    return 'N/A';
  };

  const getBusNumber = (booking: Booking): string => {
    if (typeof booking.busId === 'object' && booking.busId) {
      return booking.busId.registrationNumber;
    }
    return 'N/A';
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      getUserName(booking).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRouteName(booking).toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button 
                  className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-2 text-white transition-all hover:scale-110 hover:shadow-lg"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Booking Management
                </h1>
                <p className="text-gray-600 mt-1">Manage customer bookings and reservations</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by passenger, route, seat, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Payment Status</option>
                  <option value="pending">Payment Pending</option>
                  <option value="completed">Payment Completed</option>
                  <option value="failed">Payment Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Bus / Seat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Travel Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {booking._id.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserName(booking)}
                        </div>
                        {typeof booking.userId === 'object' && booking.userId?.email && (
                          <div className="text-xs text-gray-500">{booking.userId.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getRouteName(booking)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getBusNumber(booking)}</div>
                        <div className="text-xs text-gray-500">Seat: {booking.seatNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.travelDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">Rs. {booking.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleUpdateStatus(booking._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={booking.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(booking._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                            booking.paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : booking.paymentStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.paymentStatus === 'refunded'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Link href={`/admin/bookings/${booking._id}`}>
                          <button className="text-blue-600 hover:text-blue-900 font-medium">
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Bookings</div>
            <div className="text-3xl font-bold text-blue-600">{bookings.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Confirmed</div>
            <div className="text-3xl font-bold text-green-600">
              {bookings.filter(b => b.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-indigo-600">
              Rs. {bookings.filter(b => b.paymentStatus === 'completed').reduce((sum, b) => sum + b.price, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
