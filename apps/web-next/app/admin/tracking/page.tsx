'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface BusLocation {
  _id: string;
  busId: {
    _id: string;
    registrationNumber: string;
    busType: string;
  };
  driverId?: {
    fullName: string;
  };
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  speed: number;
  heading?: number;
  status: string;
  passengers?: number;
  timestamp: string;
}

export default function AdminLiveTrackingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'owner'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'owner')) {
      initializeSocket();
      fetchInitialData();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const initializeSocket = () => {
    const token = localStorage.getItem('auth_tokens');
    const tokens = token ? JSON.parse(token) : null;

    const socket = io({
      path: '/api/socket',
      auth: {
        token: tokens?.accessToken,
      },
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket.emit('track:all');
    });

    socket.on('buses:locations', (locations: BusLocation[]) => {
      setBuses(locations);
      setLoading(false);
    });

    socket.on('bus:location', (location: BusLocation) => {
      setBuses((prev) => {
        const existing = prev.findIndex((b) => b.busId._id === location.busId._id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = location;
          return updated;
        }
        return [...prev, location];
      });
    });

    socket.on('bus:status', (data: { busId: string; status: string }) => {
      setBuses((prev) =>
        prev.map((b) => (b.busId._id === data.busId ? { ...b, status: data.status } : b))
      );
    });

    socketRef.current = socket;
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch('/api/tracking/location', {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuses(data.locations || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    if (filter === 'all') return true;
    return bus.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving':
        return 'bg-green-100 text-green-800';
      case 'stopped':
        return 'bg-yellow-100 text-yellow-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'moving':
        return '🚌';
      case 'stopped':
        return '⏸️';
      case 'idle':
        return '⏱️';
      case 'offline':
        return '❌';
      default:
        return '📍';
    }
  };

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const movingCount = buses.filter((b) => b.status === 'moving').length;
  const stoppedCount = buses.filter((b) => b.status === 'stopped').length;
  const idleCount = buses.filter((b) => b.status === 'idle').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Bus Tracking</h1>
              <p className="text-sm text-gray-600">Real-time location monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-900">Live</span>
              </div>
              <div className="text-sm text-gray-600">
                {buses.length} bus{buses.length !== 1 ? 'es' : ''} online
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Total Buses</p>
            <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-green-700">Moving</p>
            <p className="text-2xl font-bold text-green-900">{movingCount}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <p className="text-sm text-yellow-700">Stopped</p>
            <p className="text-2xl font-bold text-yellow-900">{stoppedCount}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 shadow">
            <p className="text-sm text-gray-700">Idle</p>
            <p className="text-2xl font-bold text-gray-900">{idleCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Buses' },
            { value: 'moving', label: 'Moving' },
            { value: 'stopped', label: 'Stopped' },
            { value: 'idle', label: 'Idle' },
            { value: 'offline', label: 'Offline' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Map View */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Map View</h2>
              <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-500">🗺️</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Map integration (Google Maps / Leaflet) will be here
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Showing {filteredBuses.length} buses in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bus List */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white shadow">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Buses</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredBuses.map((bus) => (
                  <div
                    key={bus._id}
                    className={`border-b px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                      selectedBus === bus.busId._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedBus(bus.busId._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getStatusIcon(bus.status)}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {bus.busId.registrationNumber}
                            </h3>
                            <p className="text-sm text-gray-600">{bus.busId.busType}</p>
                          </div>
                        </div>
                        {bus.driverId && (
                          <p className="mt-1 text-sm text-gray-500">
                            Driver: {bus.driverId.fullName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            bus.status
                          )}`}
                        >
                          {bus.status}
                        </span>
                        <p className="mt-1 text-sm text-gray-600">{bus.speed} km/h</p>
                        {bus.passengers !== undefined && (
                          <p className="text-xs text-gray-500">
                            👥 {bus.passengers} passengers
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(bus.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredBuses.length === 0 && (
                  <div className="py-12 text-center text-gray-500">
                    No buses found with status "{filter}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
