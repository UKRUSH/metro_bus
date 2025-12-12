'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Driver {
  _id: string;
  fullName: string;
  licenseNumber: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  busType: string;
}

interface Route {
  _id: string;
  name: string;
  code: string;
}

interface Schedule {
  _id: string;
  departureTime: string;
}

interface TripLog {
  _id: string;
  driverId: Driver | string;
  busId: Bus | string;
  scheduleId: Schedule | string;
  routeId: Route | string;
  startTime: string;
  endTime?: string;
  startLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  endLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  mileage?: number;
  passengerCount?: number;
  fuelUsed?: number;
  status: 'started' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTripLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    console.log('Auth check - isAuthenticated:', isAuthenticated);
    console.log('User:', user);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['ADMIN', 'OWNER', 'admin', 'owner'];
    if (user && !allowedRoles.includes(user.role)) {
      console.log('Access denied. User role:', user.role);
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchTrips();
  }, [isAuthenticated, user, router]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/drivers/trips?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trip logs');
      }

      const result = await response.json();
      console.log('Fetched trip logs:', result);
      
      const tripsData = result.data?.trips || result.trips || [];
      setTrips(tripsData);
    } catch (err: any) {
      console.error('Fetch trip logs error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDriverName = (trip: TripLog): string => {
    if (typeof trip.driverId === 'object' && trip.driverId) {
      return trip.driverId.fullName || 'Unknown';
    }
    return 'Unknown';
  };

  const getBusInfo = (trip: TripLog): string => {
    if (typeof trip.busId === 'object' && trip.busId) {
      return `${trip.busId.registrationNumber} (${trip.busId.busType})`;
    }
    return 'N/A';
  };

  const getRouteName = (trip: TripLog): string => {
    if (typeof trip.routeId === 'object' && trip.routeId) {
      return `${trip.routeId.name} (${trip.routeId.code})`;
    }
    return 'N/A';
  };

  const calculateDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'In Progress';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      started: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = 
      getDriverName(trip).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBusInfo(trip).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRouteName(trip).toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Driver', 'Bus', 'Route', 'Start Time', 'End Time', 'Duration', 'Kilometers', 'Passengers', 'Fuel Used', 'Status', 'Notes'];
    const rows = filteredTrips.map(trip => [
      new Date(trip.startTime).toLocaleDateString(),
      getDriverName(trip),
      getBusInfo(trip),
      getRouteName(trip),
      new Date(trip.startTime).toLocaleTimeString(),
      trip.endTime ? new Date(trip.endTime).toLocaleTimeString() : 'N/A',
      calculateDuration(trip.startTime, trip.endTime),
      trip.mileage || 'N/A',
      trip.passengerCount || 'N/A',
      trip.fuelUsed || 'N/A',
      trip.status,
      trip.notes || '',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip logs...</p>
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
                <button className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-2 text-white transition-all hover:scale-110 hover:shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Driver Trip Logs
                </h1>
                <p className="text-gray-600 mt-1">Monitor and analyze daily driver trips</p>
              </div>
            </div>
            <button
              onClick={exportToCSV}
              className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-white font-medium hover:shadow-lg transition-all"
            >
              📥 Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by driver, bus, or route..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); fetchTrips(); }}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="started">Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); }}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Start Date"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); }}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="End Date"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchTrips}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 transition-all"
              >
                🔍 Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Trip Logs Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No trip logs found
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(trip.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Start: {new Date(trip.startTime).toLocaleTimeString()}
                        </div>
                        {trip.endTime && (
                          <div className="text-xs text-gray-500">
                            End: {new Date(trip.endTime).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getDriverName(trip)}
                        </div>
                        {typeof trip.driverId === 'object' && trip.driverId?.licenseNumber && (
                          <div className="text-xs text-gray-500">
                            Lic: {trip.driverId.licenseNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getBusInfo(trip)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getRouteName(trip)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {calculateDuration(trip.startTime, trip.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {trip.mileage ? `🚗 ${trip.mileage} km` : '🚗 N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {trip.passengerCount ? `👥 ${trip.passengerCount} passengers` : '👥 N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {trip.fuelUsed ? `⛽ ${trip.fuelUsed}L` : '⛽ N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(trip.status)}`}>
                          {trip.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {trip.notes && (
                          <div className="text-xs text-gray-600 mt-1 max-w-xs truncate" title={trip.notes}>
                            📝 {trip.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Link href={`/admin/trip-logs/${trip._id}`}>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Trips</div>
            <div className="text-3xl font-bold text-blue-600">{trips.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {trips.filter(t => t.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">In Progress</div>
            <div className="text-3xl font-bold text-yellow-600">
              {trips.filter(t => t.status === 'in_progress' || t.status === 'started').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total KM</div>
            <div className="text-3xl font-bold text-indigo-600">
              {trips.reduce((sum, t) => sum + (t.mileage || 0), 0).toFixed(0)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Passengers</div>
            <div className="text-3xl font-bold text-purple-600">
              {trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Fuel (L)</div>
            <div className="text-3xl font-bold text-orange-600">
              {trips.reduce((sum, t) => sum + (t.fuelUsed || 0), 0).toFixed(1)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
