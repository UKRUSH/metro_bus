'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Route {
  _id: string;
  name: string;
  code: string;
  fare: number;
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
  busId: Bus;
  bookedSeats: number[];
  availableSeats: number;
}

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const scheduleId = searchParams.get('scheduleId');
  const routeId = searchParams.get('routeId');
  const date = searchParams.get('date');

  const [route, setRoute] = useState<Route | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!scheduleId || !routeId || !date) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    fetchData();
  }, [scheduleId, routeId, date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch route details
      const routeRes = await fetch(`/api/routes/${routeId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!routeRes.ok) throw new Error('Failed to fetch route');
      const routeData = await routeRes.json();
      setRoute(routeData);

      // Fetch schedule with seat availability
      const scheduleRes = await fetch(`/api/routes/${routeId}/schedules?date=${date}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!scheduleRes.ok) throw new Error('Failed to fetch schedule');
      const schedules = await scheduleRes.json();
      const selectedSchedule = schedules.find((s: Schedule) => s._id === scheduleId);
      
      if (!selectedSchedule) throw new Error('Schedule not found');
      setSchedule(selectedSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
      alert('Please select a seat');
      return;
    }

    try {
      setBooking(true);
      setError('');

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          scheduleId,
          seatNumber: selectedSeat,
          travelDate: date,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      const bookingData = await response.json();
      router.push(`/bookings/${bookingData._id}?success=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderSeats = () => {
    if (!schedule) return null;

    const capacity = schedule.busId.capacity;
    const rows = Math.ceil(capacity / 4);
    const seats: React.ReactNode[] = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats: React.ReactNode[] = [];
      
      for (let col = 0; col < 4; col++) {
        if (col === 2) {
          // Aisle space
          rowSeats.push(
            <div key={`aisle-${row}`} className="w-8"></div>
          );
          continue;
        }

        const seatNumber = row * 4 + col + 1 - Math.floor(col / 3);
        if (seatNumber > capacity) break;

        const isBooked = schedule.bookedSeats.includes(seatNumber);
        const isSelected = selectedSeat === seatNumber;

        rowSeats.push(
          <button
            key={seatNumber}
            onClick={() => !isBooked && setSelectedSeat(seatNumber)}
            disabled={isBooked}
            className={`
              h-12 w-12 rounded-lg border-2 font-semibold text-sm transition-all
              ${isBooked ? 'bg-gray-300 border-gray-400 cursor-not-allowed text-gray-500' : ''}
              ${isSelected ? 'bg-blue-600 border-blue-700 text-white scale-105' : ''}
              ${!isBooked && !isSelected ? 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50' : ''}
            `}
          >
            {seatNumber}
          </button>
        );
      }

      seats.push(
        <div key={row} className="flex justify-center gap-2">
          {rowSeats}
        </div>
      );
    }

    return seats;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !route || !schedule) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="text-xl font-semibold text-red-700">Error</p>
          <p className="mt-2 text-red-600">{error || 'Failed to load booking details'}</p>
          <Link
            href="/search"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Search
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
            <Link href={`/routes?date=${date}`}>
              <button className="rounded-lg p-2 hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Select Your Seat</h1>
              <p className="text-sm text-gray-600">{route.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Seat Selection */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-6 text-xl font-bold text-gray-900">Select Seat</h2>
              
              {/* Legend */}
              <div className="mb-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg border-2 border-gray-300 bg-white"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg border-2 border-blue-700 bg-blue-600"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg border-2 border-gray-400 bg-gray-300"></div>
                  <span>Booked</span>
                </div>
              </div>

              {/* Driver */}
              <div className="mb-4 flex justify-center">
                <div className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
                  🚗 Driver
                </div>
              </div>

              {/* Seats */}
              <div className="space-y-2">
                {renderSeats()}
              </div>

              {/* Stats */}
              <div className="mt-6 flex justify-around rounded-lg bg-gray-50 p-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{schedule.busId.capacity}</p>
                  <p className="text-sm text-gray-600">Total Seats</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{schedule.availableSeats}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{schedule.bookedSeats.length}</p>
                  <p className="text-sm text-gray-600">Booked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow sticky top-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Booking Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Route</span>
                  <span className="font-semibold text-gray-900">{route.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bus</span>
                  <span className="font-semibold text-gray-900">{schedule.busId.registrationNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type</span>
                  <span className="font-semibold text-gray-900">{schedule.busId.busType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(date!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Departure</span>
                  <span className="font-semibold text-gray-900">{formatTime(schedule.departureTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Arrival</span>
                  <span className="font-semibold text-gray-900">{formatTime(schedule.arrivalTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Seat Number</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSeat ? `#${selectedSeat}` : 'Not selected'}
                  </span>
                </div>
              </div>

              <div className="mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total Fare</span>
                  <span className="text-2xl font-bold text-blue-600">LKR {route.fare.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Payment Method (Optional)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Pay Later</option>
                  <option value="cash">Cash on Bus</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile">Mobile Payment</option>
                </select>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={!selectedSeat || booking}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {booking ? 'Booking...' : 'Confirm Booking'}
              </button>

              <p className="mt-4 text-center text-xs text-gray-600">
                By booking, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
