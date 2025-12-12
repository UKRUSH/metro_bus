'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Route {
  _id: string;
  name: string;
  code: string;
  fare: number;
}

interface Bus {
  _id: string;
  registrationNumber: string;
}

interface Schedule {
  _id: string;
  departureTime: string;
  arrivalTime: string;
}

interface Booking {
  _id: string;
  routeId: Route;
  scheduleId: Schedule;
  busId: Bus;
  seatNumber: number;
  travelDate: string;
  bookingDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
}

export default function BookingsPage() {
  const router = useRouter();
  const { tokens, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [statusFilter, isAuthenticated, router]);

  const fetchBookings = async () => {
    if (!tokens?.accessToken) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/bookings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="rounded-lg p-2 hover:bg-gray-100">
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-sm text-gray-600">{bookings.length} total bookings</p>
              </div>
            </div>
            <Link
              href="/search"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New Booking
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancelled
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Error loading bookings</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No bookings yet</h3>
            <p className="mt-2 text-gray-600">Start your journey by booking your first trip</p>
            <Link
              href="/search"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Search Routes
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                onClick={() => router.push(`/bookings/${booking._id}`)}
                className="cursor-pointer rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Side - Journey Info */}
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.toUpperCase()}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{booking.routeId.name}</h3>
                    <div className="mt-2 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Travel: {formatDate(booking.travelDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {formatTime(booking.scheduleId.departureTime)} - {formatTime(booking.scheduleId.arrivalTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>Bus: {booking.busId.registrationNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <span>Seat #{booking.seatNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Price & Action */}
                  <div className="flex flex-row sm:flex-col items-center justify-between sm:items-end gap-4 sm:gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">LKR {booking.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Booked: {formatDate(booking.bookingDate)}</p>
                    </div>
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
