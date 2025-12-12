'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Stop {
  name: string;
  latitude?: number;
  longitude?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  arrivalTime?: string;
  order?: number;
}

interface Route {
  _id: string;
  name: string;
  code: string;
  origin: string;
  destination: string;
  routeNumber?: string; // For backward compatibility
  distance: number;
  estimatedDuration: number;
  fare: number;
  stops: Stop[];
  isActive: boolean;
  createdAt: string;
}

export default function RouteManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    routeNumber: '',
    origin: '',
    destination: '',
    distance: 0,
    estimatedDuration: 0,
    fare: 0,
    stops: [] as Stop[],
    isActive: true,
  });

  const [newStop, setNewStop] = useState<Stop>({
    name: '',
    latitude: 0,
    longitude: 0,
    arrivalTime: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchRoutes();
  }, [isAuthenticated, user, router]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/routes?isActive=all', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }

      const result = await response.json();
      console.log('Fetched routes response:', result);
      
      // Handle both response formats
      const routesData = result.data?.routes || result.routes || [];
      console.log('Routes data:', routesData);
      setRoutes(routesData);
    } catch (err: any) {
      console.error('Fetch routes error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.name || !formData.routeNumber) {
      setError('Route name and route number are required');
      alert('Please fill in Route Name and Route Number');
      return;
    }

    if (!formData.origin || !formData.destination) {
      setError('Origin and Destination are required');
      alert('Please fill in both Origin (Starting Point) and Destination (End Point)');
      return;
    }

    if (!formData.distance || formData.distance <= 0) {
      setError('Distance must be greater than 0');
      alert('Please enter a valid distance in kilometers');
      return;
    }

    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) {
      setError('Duration must be greater than 0');
      alert('Please enter a valid duration in minutes');
      return;
    }

    if (!formData.fare || formData.fare <= 0) {
      setError('Fare must be greater than 0');
      alert('Please enter a valid fare amount');
      return;
    }
    
    // Validate stops
    if (formData.stops.length < 2) {
      setError('Route must have at least 2 stops');
      alert('Please add at least 2 stops to the route');
      return;
    }
    
    try {
      // Build complete route data
      const routeData = {
        name: formData.name.trim(),
        code: formData.routeNumber.trim().toUpperCase(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        distance: Number(formData.distance),
        estimatedDuration: Number(formData.estimatedDuration),
        fare: Number(formData.fare),
        isActive: formData.isActive,
        stops: formData.stops.map((stop, index) => ({
          name: stop.name.trim(),
          location: {
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
          },
          order: index + 1,
        })),
      };

      console.log('=== CREATING NEW ROUTE ===');
      console.log('Route Data:', JSON.stringify(routeData, null, 2));

      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(routeData),
      });

      console.log('Response Status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        console.error('Route creation failed:', errorData);
        throw new Error(errorData.details 
          ? `Validation failed: ${JSON.stringify(errorData.details)}` 
          : errorData.error || `Failed to create route: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('✅ Route created successfully:', result);
      console.log('Saved Origin:', result.data?.route?.origin);
      console.log('Saved Destination:', result.data?.route?.destination);

      alert('Route created successfully!');
      await fetchRoutes();
      resetForm();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('❌ Create route error:', err);
      setError(err.message);
      alert('Error creating route: ' + err.message);
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    // Validate stops
    if (formData.stops.length < 2) {
      setError('Route must have at least 2 stops');
      return;
    }

    try {
      // Transform data to match backend schema
      const transformedData = {
        name: formData.name,
        code: formData.routeNumber,
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        distance: formData.distance,
        estimatedDuration: formData.estimatedDuration,
        fare: formData.fare,
        isActive: formData.isActive,
        stops: formData.stops.map((stop, index) => ({
          name: stop.name,
          location: {
            latitude: stop.latitude,
            longitude: stop.longitude,
          },
          order: index + 1,
        })),
      };

      console.log('Updating route with data:', transformedData);
      
      const response = await fetch(`/api/routes/${editingRoute._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        throw new Error(errorData.details 
          ? `Validation failed: ${JSON.stringify(errorData.details)}` 
          : errorData.error || 'Failed to update route'
        );
      }

      const result = await response.json();
      console.log('Route updated successfully:', result);

      await fetchRoutes();
      resetForm();
      setEditingRoute(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update route status');
      }

      alert(`Route ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchRoutes();
    } catch (err: any) {
      console.error('Toggle status error:', err);
      setError(err.message);
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this route? This action cannot be undone.')) return;

    try {
      console.log('Attempting to delete route with ID:', id);
      const response = await fetch(`/api/routes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete route');
      }

      alert('Route deleted permanently');
      await fetchRoutes();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message);
      alert('Error: ' + err.message);
    }
  };

  const handleAddStop = () => {
    if (!newStop.name || !newStop.latitude || !newStop.longitude) {
      alert('Please fill all stop fields');
      return;
    }

    setFormData({
      ...formData,
      stops: [...formData.stops, newStop],
    });

    setNewStop({
      name: '',
      latitude: 0,
      longitude: 0,
      arrivalTime: '',
    });
  };

  const handleRemoveStop = (index: number) => {
    setFormData({
      ...formData,
      stops: formData.stops.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      routeNumber: '',
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0,
      fare: 0,
      stops: [],
      isActive: true,
    });
    setNewStop({
      name: '',
      latitude: 0,
      longitude: 0,
      arrivalTime: '',
    });
  };

  const openEditModal = (route: Route) => {
    console.log('Opening edit modal for route:', route);
    console.log('Route stops:', route.stops);
    
    setEditingRoute(route);
    setFormData({
      name: route.name,
      routeNumber: route.code || route.routeNumber || '',
      origin: route.origin || '',
      destination: route.destination || '',
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      fare: route.fare,
      stops: route.stops.map(stop => {
        // Handle both formats: stop.location.latitude or stop.latitude
        const lat = stop.location?.latitude ?? stop.latitude ?? 0;
        const lng = stop.location?.longitude ?? stop.longitude ?? 0;
        console.log(`Stop ${stop.name}: lat=${lat}, lng=${lng}`);
        return {
          name: stop.name,
          latitude: lat,
          longitude: lng,
          arrivalTime: stop.arrivalTime || '',
        };
      }),
      isActive: route.isActive,
    });
    setShowCreateModal(true);
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.code || route.routeNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.stops.some(stop => stop.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterActive === null || route.isActive === filterActive;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-2 text-white transition-all hover:scale-110 hover:shadow-lg"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Route Management
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Manage bus routes, stops, and schedules
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
              <span className="relative flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Route
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={filterActive === null ? 'all' : filterActive.toString()}
            onChange={(e) =>
              setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')
            }
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Routes Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Origin - Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Distance / Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Fare
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stops
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No routes found
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => {
                  console.log('Displaying route:', { _id: route._id, name: route.name, code: route.code });
                  return (
                  <tr key={route._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{route.name}</div>
                      <div className="text-sm text-gray-500">#{route.code || route.routeNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {route.origin && route.destination ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-green-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="8"/>
                              </svg>
                              {route.origin}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="8"/>
                              </svg>
                              {route.destination}
                            </span>
                          </div>
                        ) : route.stops && route.stops.length > 1 ? (
                          <span className="text-gray-500 text-xs">{route.stops[0]?.name} → {route.stops[route.stops.length - 1]?.name}</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not set</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{route.distance} km</div>
                      <div className="text-sm text-gray-500">{route.estimatedDuration} min</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">Rs. {route.fare}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{route.stops.length} stops</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(route._id, route.isActive)}
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          route.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {route.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(route)}
                        className="mr-3 text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingRoute) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-8 shadow-2xl border border-blue-100/50">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {editingRoute ? 'Edit Route' : 'Create New Route'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the details to {editingRoute ? 'update' : 'create'} a route</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRoute(null);
                  resetForm();
                }}
                className="rounded-full p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={editingRoute ? handleUpdateRoute : handleCreateRoute}>
              {/* Basic Information Section */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-2 border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
                    <p className="text-sm text-gray-600">Route identification and location details</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="e.g., Downtown Express"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.routeNumber}
                      onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                      placeholder="e.g., R001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Origin (Starting Point) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                      placeholder="e.g., City Center Terminal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destination (End Point) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      className="w-full rounded-xl border-2 border-red-200 bg-white px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                      placeholder="e.g., International Airport"
                    />
                  </div>
                </div>
              </div>

              {/* Route Details Section */}
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border-2 border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2.5 shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Route Details</h3>
                    <p className="text-sm text-gray-600">Distance, duration, and fare information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={formData.distance || ''}
                      onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.estimatedDuration || ''}
                      onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fare (Rs) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.fare || ''}
                      onChange={(e) => setFormData({ ...formData, fare: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Active Route</span>
                  </label>
                </div>
              </div>

              {/* Stops Section */}
              <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border-2 border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Route Stops</h3>
                    <p className="text-sm text-gray-600">Add stops with coordinates (minimum 2 required)</p>
                  </div>
                </div>

                {/* Existing Stops */}
                {formData.stops.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="group flex items-center justify-between rounded-xl border-2 border-blue-200 bg-white p-4 transition-all hover:shadow-md">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-md">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{stop.name}</div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                Lat: {stop.latitude}
                              </span>
                              <span>Lng: {stop.longitude}</span>
                              {stop.arrivalTime && <span className="text-indigo-600">• Arrival: {stop.arrivalTime}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="rounded-lg px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Stop */}
                <div className="rounded-xl border-2 border-dashed border-blue-300 bg-white p-6">
                  <h4 className="mb-4 font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Stop
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Stop name"
                        value={newStop.name}
                        onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Latitude"
                        step="0.000001"
                        value={newStop.latitude || ''}
                        onChange={(e) => setNewStop({ ...newStop, latitude: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Longitude"
                        step="0.000001"
                        value={newStop.longitude || ''}
                        onChange={(e) => setNewStop({ ...newStop, longitude: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Arrival time (optional, e.g., 09:30 AM)"
                        value={newStop.arrivalTime || ''}
                        onChange={(e) => setNewStop({ ...newStop, arrivalTime: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="mt-3 w-full rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                  >
                    + Add Stop
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRoute(null);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition-all hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="group flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    {editingRoute ? (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Update Route
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Route
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
