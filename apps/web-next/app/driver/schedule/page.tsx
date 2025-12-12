'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Schedule {
  _id: string;
  routeId: {
    _id: string;
    name: string;
    origin: string;
    destination: string;
  };
  busId: {
    _id: string;
    registrationNumber: string;
    busType: string;
    capacity: number;
  };
  departureTime: string;
  arrivalTime: string;
  days: string[];
  isActive: boolean;
}

export default function DriverSchedulePage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [startingTrip, setStartingTrip] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'driver') {
      router.push('/dashboard');
      return;
    }

    fetchSchedules();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'driver' && tokens?.accessToken) {
      fetchSchedules();
    }
  }, [tokens?.accessToken]);

  const fetchSchedules = async () => {
    if (!tokens?.accessToken || !user) {
      console.log('No tokens or user available yet', { tokens, user });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      console.log('Fetching schedules with token:', tokens.accessToken.substring(0, 20) + '...');
      console.log('User role:', user.role);
      console.log('Day:', today);
      
      const response = await fetch(`/api/schedules?day=${today}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schedules');
      }

      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message || 'An error occurred while fetching schedules');
    } finally {
      setLoading(false);
    }
  };

  const startTrip = async (schedule: Schedule) => {
    if (!tokens) return;
    
    try {
      setStartingTrip(true);
      const response = await fetch('/api/drivers/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          scheduleId: schedule._id,
          busId: schedule.busId._id,
          routeId: schedule.routeId._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trip');
      }

      const data = await response.json();
      alert('Trip started successfully!');
      router.push('/driver/trips');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStartingTrip(false);
      setSelectedSchedule(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  const getTodayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Today's Schedule</h1>
              <p className="text-gray-600">{getTodayName()}, {new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={() => router.push('/driver')} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-red-800">Error Loading Schedules</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchSchedules}
                className="rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!error && schedules.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No Schedules Today</h2>
            <p className="mt-2 text-gray-600">You don't have any assigned schedules for {getTodayName()}.</p>
            <button
              onClick={fetchSchedules}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        ) : error ? null : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule._id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-lg bg-blue-100 p-3">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{schedule.routeId.name}</h3>
                        <p className="text-gray-600">{schedule.routeId.origin} → {schedule.routeId.destination}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Bus</p>
                        <p className="text-gray-900">{schedule.busId.registrationNumber}</p>
                        <p className="text-sm text-gray-600">{schedule.busId.busType} • {schedule.busId.capacity} seats</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Departure Time</p>
                        <p className="text-2xl font-bold text-gray-900">{schedule.departureTime}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Arrival Time</p>
                        <p className="text-2xl font-bold text-gray-900">{schedule.arrivalTime}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSchedule(schedule)}
                    className="ml-4 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    Start Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Start Trip Confirmation Modal */}
        {selectedSchedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Confirm Start Trip</h3>
              
              <div className="mb-6 space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Route:</span> {selectedSchedule.routeId.name}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Bus:</span> {selectedSchedule.busId.registrationNumber}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Departure:</span> {selectedSchedule.departureTime}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedSchedule(null)}
                  disabled={startingTrip}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startTrip(selectedSchedule)}
                  disabled={startingTrip}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {startingTrip ? 'Starting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
