'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Bus {
  _id: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
  routeId?: {
    _id: string;
    name: string;
    code: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  speed?: number;
  heading?: number;
  lastLocationUpdate?: string;
  currentStatus: string;
  facilities: string[];
}

export default function BusTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');

  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.9271, 79.8612]); // Colombo, Sri Lanka
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchBuses();
    
    // Initialize Socket.IO for real-time updates
    if (typeof window !== 'undefined') {
      import('socket.io-client').then((module) => {
        const io = module.default;
        const socket = io(window.location.origin, {
          path: '/api/socket',
        });

        socket.on('connect', () => {
          console.log('🔌 Connected to Socket.IO');
          
          // Subscribe to all buses for tracking (public access)
          socket.emit('track:all');

          // Subscribe to route if specified
          if (routeId) {
            socket.emit('subscribe_route', routeId);
          }
        });

        socket.on('bus_location_update', (data: any) => {
          console.log('📍 Bus location update:', data);
          
          setBuses((prevBuses) =>
            prevBuses.map((bus) =>
              bus._id === data.busId
                ? {
                    ...bus,
                    currentLocation: data.location,
                    speed: data.speed,
                    heading: data.heading,
                    lastLocationUpdate: data.timestamp,
                  }
                : bus
            )
          );
        });

        socketRef.current = socket;

        return () => {
          socket.disconnect();
        };
      });
    }
  }, [routeId]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (routeId) params.append('routeId', routeId);
      params.append('status', 'in-service');
      params.append('limit', '50');
      params.append('public', 'true'); // Public access flag

      const response = await fetch(`/api/buses?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data = await response.json();
      const activeBuses = data.data.buses.filter((bus: Bus) => bus.currentLocation);
      
      setBuses(activeBuses);
      
      // Center map on first bus or keep default
      if (activeBuses.length > 0 && activeBuses[0].currentLocation) {
        setMapCenter([
          activeBuses[0].currentLocation.lat,
          activeBuses[0].currentLocation.lng,
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getLastUpdateText = (lastUpdate?: string) => {
    if (!lastUpdate) return 'Unknown';
    
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
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
                <h1 className="text-xl font-bold text-gray-900">Real-time Bus Tracking</h1>
                <p className="text-sm text-gray-600">
                  {buses.length} bus{buses.length !== 1 ? 'es' : ''} in service
                </p>
              </div>
            </div>
            <button
              onClick={fetchBuses}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Map Section */}
        <div className="relative flex-1">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%', minHeight: '500px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {buses.map((bus) =>
                bus.currentLocation ? (
                  <Marker
                    key={bus._id}
                    position={[bus.currentLocation.lat, bus.currentLocation.lng]}
                    eventHandlers={{
                      click: () => setSelectedBus(bus),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">{bus.registrationNumber}</p>
                        <p className="text-sm">
                          {bus.routeId ? `${bus.routeId.name} (${bus.routeId.code})` : 'No route assigned'}
                        </p>
                        {bus.speed !== undefined && (
                          <p className="text-sm">Speed: {bus.speed} km/h</p>
                        )}
                        <p className="text-xs text-gray-600">
                          Updated: {getLastUpdateText(bus.lastLocationUpdate)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full border-t bg-white lg:w-96 lg:border-l lg:border-t-0">
          <div className="p-4">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Active Buses</h2>
            
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {buses.length === 0 && !loading && (
              <div className="py-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="mt-2">No buses currently in service</p>
              </div>
            )}

            <div className="space-y-3">
              {buses.map((bus) => (
                <div
                  key={bus._id}
                  onClick={() => {
                    setSelectedBus(bus);
                    if (bus.currentLocation) {
                      setMapCenter([bus.currentLocation.lat, bus.currentLocation.lng]);
                    }
                  }}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors hover:border-blue-600 ${
                    selectedBus?._id === bus._id ? 'border-blue-600 bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{bus.registrationNumber}</p>
                      <p className="text-sm text-gray-600">
                        {bus.routeId ? `${bus.routeId.name}` : 'No route'}
                      </p>
                      {bus.routeId && (
                        <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {bus.routeId.code}
                        </span>
                      )}
                    </div>
                    {bus.speed !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{bus.speed}</p>
                        <p className="text-xs text-gray-600">km/h</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getLastUpdateText(bus.lastLocationUpdate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
