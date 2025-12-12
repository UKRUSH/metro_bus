'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Stop {
  name: string;
  location: { lat: number; lng: number };
  order: number;
}

interface Route {
  _id: string;
  name: string;
  code: string;
  fare: number;
  stops: Stop[];
}

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
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
  paymentMethod?: string;
  transactionId?: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const showSuccess = searchParams.get('success') === 'true';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    const confirmed = confirm(
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setCancelling(true);
      setError('');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel booking');
      }

      await fetchBooking();
      alert('Booking cancelled successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancelling(false);
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
      month: 'long',
      day: 'numeric',
    });
  };

  const canCancel = booking && 
    booking.status !== 'cancelled' && 
    booking.status !== 'completed' &&
    new Date(booking.travelDate) > new Date();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="text-xl font-semibold text-red-700">Error</p>
          <p className="mt-2 text-red-600">{error || 'Booking not found'}</p>
          <Link
            href="/bookings"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/bookings">
              <button className="rounded-lg p-2 hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-sm text-gray-600">ID: {booking._id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Booking confirmed successfully!</p>
            </div>
          </div>
        )}

        {/* Status Badges */}
        <div className="mb-6 flex flex-wrap gap-2">
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(booking.status)}`}>
            {booking.status.toUpperCase()}
          </span>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
            Payment: {booking.paymentStatus.toUpperCase()}
          </span>
        </div>

        <div className="space-y-6">
          {/* Journey Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Journey Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-semibold text-gray-900">{booking.routeId.name}</p>
                <p className="text-sm text-gray-500">Code: {booking.routeId.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Travel Date</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.travelDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Departure Time</p>
                <p className="font-semibold text-gray-900">{formatTime(booking.scheduleId.departureTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrival Time</p>
                <p className="font-semibold text-gray-900">{formatTime(booking.scheduleId.arrivalTime)}</p>
              </div>
            </div>
          </div>

          {/* Route Stops */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Route Stops</h2>
            <div className="space-y-3">
              {booking.routeId.stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {stop.order}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{stop.name}</p>
                    <p className="text-sm text-gray-600">
                      {stop.location.lat.toFixed(4)}, {stop.location.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bus & Seat Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Bus & Seat Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Bus Registration</p>
                <p className="font-semibold text-gray-900">{booking.busId.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bus Type</p>
                <p className="font-semibold text-gray-900">{booking.busId.busType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seat Number</p>
                <p className="text-3xl font-bold text-blue-600">#{booking.seatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Capacity</p>
                <p className="font-semibold text-gray-900">{booking.busId.capacity} seats</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Payment Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Fare</p>
                <p className="text-2xl font-bold text-blue-600">LKR {booking.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.bookingDate)}</p>
              </div>
              {booking.paymentMethod && (
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{booking.paymentMethod}</p>
                </div>
              )}
              {booking.transactionId && (
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900">{booking.transactionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Placeholder */}
          {(booking.status === 'confirmed' || booking.status === 'pending') && (
            <div className="rounded-lg bg-white p-6 shadow text-center">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Ticket QR Code</h2>
              <div className="mx-auto h-48 w-48 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="h-32 w-32 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-600">Show this code to the driver when boarding</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {canCancel && (
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            )}
            <Link
              href="/bookings"
              className="flex-1 rounded-lg bg-gray-200 px-6 py-3 text-center font-semibold text-gray-700 hover:bg-gray-300"
            >
              Back to Bookings
            </Link>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
