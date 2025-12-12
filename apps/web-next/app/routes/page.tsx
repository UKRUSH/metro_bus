'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stop {
  name: string;
  location: { lat: number; lng: number };
  order: number;
  estimatedDuration?: number;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
}

interface Driver {
  _id: string;
  profile: { firstName: string; lastName: string };
}

interface Schedule {
  _id: string;
  departureTime: string;
  arrivalTime: string;
  busId: Bus;
  driverId: Driver;
  availableSeats: number;
}

interface Route {
  _id: string;
  name: string;
  code: string;
  stops: Stop[];
  distance: number;
  estimatedDuration: number;
  fare: number;
  schedules?: Schedule[];
}

export default function RoutesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';

  useEffect(() => {
    fetchRoutes();
  }, [searchParams]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (origin) params.set('origin', origin);
      if (destination) params.set('destination', destination);
      if (date) params.set('date', date);

      const response = await fetch(`/api/routes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }

      const data = await response.json();
      setRoutes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/search" className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Available Routes</h1>
                <p className="text-sm text-gray-600">
                  {origin && destination ? `${origin} → ${destination}` : 'All routes'}
                  {date && ` • ${new Date(date).toLocaleDateString()}`}
                </p>
              </div>
            </Link>
            <Link
              href="/bookings"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Error loading routes</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && routes.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No routes found</h3>
            <p className="mt-2 text-gray-600">Try adjusting your search filters</p>
            <Link
              href="/search"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              New Search
            </Link>
          </div>
        )}

        {!loading && !error && routes.length > 0 && (
          <div className="space-y-6">
            {routes.map((route) => (
              <div key={route._id} className="rounded-lg bg-white p-6 shadow">
                {/* Route Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{route.name}</h3>
                    <p className="text-sm text-gray-600">Route Code: {route.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">LKR {route.fare.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {route.distance.toFixed(1)} km • {formatDuration(route.estimatedDuration)}
                    </p>
                  </div>
                </div>

                {/* Route Stops */}
                <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
                  {route.stops.map((stop, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm whitespace-nowrap">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {stop.order}
                        </span>
                        <span className="font-medium text-gray-900">{stop.name}</span>
                      </div>
                      {index < route.stops.length - 1 && (
                        <svg className="h-4 w-4 text-gray-400 mx-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Schedules */}
                {route.schedules && route.schedules.length > 0 ? (
                  <div>
                    <h4 className="mb-3 font-semibold text-gray-900">Available Schedules</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {route.schedules.map((schedule) => (
                        <button
                          key={schedule._id}
                          onClick={() => router.push(`/booking?scheduleId=${schedule._id}&routeId=${route._id}&date=${date}`)}
                          className="rounded-lg border-2 border-gray-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-gray-900">
                              {formatTime(schedule.departureTime)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatTime(schedule.arrivalTime)}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Bus: {schedule.busId.registrationNumber}</p>
                            <p>Type: {schedule.busId.busType}</p>
                            <p className={schedule.availableSeats > 10 ? 'text-green-600' : 'text-orange-600'}>
                              {schedule.availableSeats} seats available
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : date ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-600">
                    No schedules available for selected date
                  </div>
                ) : (
                  <Link
                    href={`/routes/${route._id}`}
                    className="block rounded-lg bg-blue-50 p-4 text-center text-sm font-semibold text-blue-600 hover:bg-blue-100"
                  >
                    View All Schedules
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
