'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Schedule {
  _id: string;
  driverId: {
    _id: string;
    fullName: string;
    licenseNumber: string;
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
  startTime?: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
}

export default function DriverSchedulePage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading: authLoading } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('approved');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'driver' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchSchedules();
  }, [authLoading, isAuthenticated, user, router, filterDate, filterStatus]);

  const fetchSchedules = async () => {
    if (!tokens?.accessToken) return;
    
    try {
      setLoading(true);
      setError('');
      
      let url = '/api/drivers/schedule-assignments?';
      if (filterStatus) {
        url += `status=${filterStatus}&`;
      }
      if (filterDate) {
        url += `date=${filterDate}&`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schedules');
      }

      const data = await response.json();
      setSchedules(data.data?.assignments || data.assignments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  const groupSchedulesByDate = () => {
    const grouped: { [key: string]: Schedule[] } = {};
    
    schedules.forEach(schedule => {
      const date = new Date(schedule.assignmentDate).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(schedule);
    });
    
    return grouped;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDate();
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
              <p className="text-gray-600 mt-1">View your assigned bus routes and schedules</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/driver/schedule-request')}
                className="rounded-lg border border-blue-600 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
              >
                Request Assignment
              </button>
              <button
                onClick={() => router.push('/driver')}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
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
                <option value="">All</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('approved');
                  setFilterDate('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

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

        {/* Schedule List */}
        {schedules.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">No Schedules Found</h2>
            <p className="mt-2 text-gray-600">You don't have any schedule assignments yet.</p>
            <button
              onClick={() => router.push('/driver/schedule-request')}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            >
              Request Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <div className="space-y-4">
                  {groupedSchedules[date].map(schedule => (
                    <div
                      key={schedule._id}
                      className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {schedule.busId.registrationNumber}
                            </h3>
                            {getStatusBadge(schedule.status)}
                          </div>
                          <p className="text-sm text-gray-600">
                            {schedule.busId.busType} • {schedule.busId.capacity} seats
                          </p>
                        </div>
                        {schedule.startTime && schedule.endTime && (
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-500">Time</p>
                            <p className="text-lg font-bold text-gray-900">
                              {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {new Date(schedule.endTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <span className="font-semibold text-gray-900">{schedule.routeId.name}</span>
                        </div>
                        {schedule.routeId.origin && schedule.routeId.destination && (
                          <p className="text-sm text-gray-600 ml-7">
                            {schedule.routeId.origin} → {schedule.routeId.destination}
                          </p>
                        )}
                      </div>

                      {schedule.notes && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-blue-700 mb-1">Notes:</p>
                          <p className="text-sm text-blue-900">{schedule.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
