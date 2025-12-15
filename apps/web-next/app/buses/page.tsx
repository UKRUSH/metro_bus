'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Owner {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface Driver {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface Route {
  _id: string;
  name: string;
  code: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  yearOfManufacture?: number;
  ownerId?: Owner;
  driverId?: Driver;
  routeId?: Route;
  isActive: boolean;
  currentStatus: 'available' | 'in-service' | 'maintenance' | 'retired';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  facilities: string[];
  createdAt: string;
  // Extended owner registration fields
  chassisNumber?: string;
  engineNumber?: string;
  routeNumbers?: string;
  routePermitNumber?: string;
  permitExpiryDate?: string;
  vehicleType?: string;
  insuranceType?: string;
  insuranceExpiryDate?: string;
  emissionTestCertificate?: string;
  emissionTestExpiry?: string;
  revenueLicenseNumber?: string;
  revenueLicenseExpiry?: string;
  tyreConditionFront?: string;
  tyreConditionRear?: string;
  brakeTestReport?: string;
  firstAidBoxAvailable?: boolean;
  fireExtinguisherAvailable?: boolean;
  cctvAvailable?: boolean;
  gpsTrackerAvailable?: boolean;
  vehicleBookUrl?: string;
  routePermitBookUrl?: string;
  insuranceCertificateUrl?: string;
  revenueLicenseScanUrl?: string;
  fitnessReportUrl?: string;
  status?: string;
}

export default function BusesPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busTypeFilter, setBusTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    // Don't redirect while auth is loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin && !isOwner) {
      router.push('/dashboard');
      return;
    }

    fetchBuses();
  }, [authLoading, isAuthenticated, isAdmin, isOwner, router, statusFilter, busTypeFilter, searchTerm]);

  const fetchBuses = async () => {
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
      if (busTypeFilter) params.set('busType', busTypeFilter);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/buses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const data = await response.json();
      console.log('Fetched buses data:', data.data.buses);
      if (data.data.buses && data.data.buses.length > 0) {
        console.log('First bus details:', JSON.stringify(data.data.buses[0], null, 2));
      }
      setBuses(data.data.buses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-service':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleBusAvailability = async (busId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!tokens?.accessToken) return;
    
    setUpdatingAvailability(busId);
    
    try {
      const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
      
      const response = await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          currentStatus: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bus status');
      }

      setNotification({
        type: 'success',
        message: `Bus ${newStatus === 'available' ? 'marked as available' : 'marked as unavailable'}`,
      });

      // Refresh buses
      await fetchBuses();
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error updating bus availability:', error);
      setNotification({
        type: 'error',
        message: 'Failed to update bus availability',
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setUpdatingAvailability(null);
    }
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
                <h1 className="text-xl font-bold text-gray-900">Bus Management</h1>
                <p className="text-sm text-gray-600">{buses.length} total buses</p>
              </div>
            </div>
            <Link
              href="/buses/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Bus
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Total Buses</p>
            <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 shadow">
            <p className="text-sm text-green-600">Available</p>
            <p className="text-2xl font-bold text-green-700">
              {buses.filter((b) => b.currentStatus === 'available').length}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4 shadow">
            <p className="text-sm text-blue-600">In Service</p>
            <p className="text-2xl font-bold text-blue-700">
              {buses.filter((b) => b.currentStatus === 'in-service').length}
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <p className="text-sm text-yellow-600">Maintenance</p>
            <p className="text-2xl font-bold text-yellow-700">
              {buses.filter((b) => b.currentStatus === 'maintenance').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Registration number, manufacturer..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="in-service">In Service</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
              <select
                value={busTypeFilter}
                onChange={(e) => setBusTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="Standard">Standard</option>
                <option value="Luxury">Luxury</option>
                <option value="Express">Express</option>
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Double Decker">Double Decker</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Error loading buses</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && buses.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No buses found</h3>
            <p className="mt-2 text-gray-600">Add your first bus to get started</p>
            <Link
              href="/buses/new"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Add Bus
            </Link>
          </div>
        )}

        {!loading && !error && buses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {buses.map((bus) => (
              <div
                key={bus._id}
                className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/buses/${bus._id}`)}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{bus.registrationNumber}</h3>
                    <p className="text-sm text-gray-600">{bus.vehicleType || bus.busType} • {bus.capacity} seats</p>
                    {bus.approvalStatus && (
                      <div className="mt-1 flex items-center gap-2">
                        {bus.approvalStatus === 'approved' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                            ✅ Approved
                          </span>
                        )}
                        {bus.approvalStatus === 'pending' && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">
                            ⏳ Pending Approval
                          </span>
                        )}
                        {bus.approvalStatus === 'rejected' && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
                            ❌ Rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isOwner && bus.approvalStatus === 'approved' ? (
                      <button
                        onClick={(e) => toggleBusAvailability(bus._id, bus.currentStatus, e)}
                        disabled={updatingAvailability === bus._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          bus.currentStatus === 'available'
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        } ${updatingAvailability === bus._id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                        title={updatingAvailability === bus._id ? 'Updating...' : (bus.currentStatus === 'available' ? 'Bus is Available - Click to mark Unavailable' : 'Bus is Unavailable - Click to mark Available')}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            bus.currentStatus === 'available' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`rounded px-3 py-1 text-xs font-semibold ${getStatusColor(bus.status || bus.currentStatus)}`}>
                        {(bus.status || bus.currentStatus).replace('-', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="mb-3 space-y-2 border-t pt-3">
                  {bus.chassisNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chassis:</span>
                      <span className="font-medium text-gray-900">{bus.chassisNumber}</span>
                    </div>
                  )}
                  {bus.engineNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Engine:</span>
                      <span className="font-medium text-gray-900">{bus.engineNumber}</span>
                    </div>
                  )}
                  {bus.routeNumbers && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Route No:</span>
                      <span className="font-medium text-gray-900">{bus.routeNumbers}</span>
                    </div>
                  )}
                </div>

                {/* Insurance & Permits */}
                <div className="mb-3 space-y-2 border-t pt-3">
                  {bus.insuranceType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-medium text-gray-900 capitalize">{bus.insuranceType}</span>
                    </div>
                  )}
                  {bus.insuranceExpiryDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span className={`font-medium ${new Date(bus.insuranceExpiryDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                        {formatDate(bus.insuranceExpiryDate)}
                      </span>
                    </div>
                  )}
                  {bus.routePermitNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Permit:</span>
                      <span className="font-medium text-gray-900">{bus.routePermitNumber}</span>
                    </div>
                  )}
                  {bus.revenueLicenseNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenue License:</span>
                      <span className="font-medium text-gray-900">{bus.revenueLicenseNumber}</span>
                    </div>
                  )}
                </div>

                {/* Safety Features */}
                {(bus.firstAidBoxAvailable || bus.fireExtinguisherAvailable || bus.cctvAvailable || bus.gpsTrackerAvailable) && (
                  <div className="mb-3 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold text-gray-600">SAFETY FEATURES</p>
                    <div className="flex flex-wrap gap-1">
                      {bus.firstAidBoxAvailable && (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">First Aid</span>
                      )}
                      {bus.fireExtinguisherAvailable && (
                        <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">Fire Ext</span>
                      )}
                      {bus.cctvAvailable && (
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">CCTV</span>
                      )}
                      {bus.gpsTrackerAvailable && (
                        <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">GPS</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bus Condition */}
                {(bus.tyreConditionFront || bus.tyreConditionRear || bus.brakeTestReport) && (
                  <div className="mb-3 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold text-gray-600">CONDITION</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {bus.tyreConditionFront && (
                        <div className="rounded bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Front Tyres</p>
                          <p className="text-sm font-bold text-gray-900 capitalize">{bus.tyreConditionFront}</p>
                        </div>
                      )}
                      {bus.tyreConditionRear && (
                        <div className="rounded bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Rear Tyres</p>
                          <p className="text-sm font-bold text-gray-900 capitalize">{bus.tyreConditionRear}</p>
                        </div>
                      )}
                      {bus.brakeTestReport && (
                        <div className="rounded bg-gray-50 p-2">
                          <p className="text-xs text-gray-500">Brakes</p>
                          <p className="text-sm font-bold text-gray-900 capitalize">{bus.brakeTestReport}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {bus.routeId && (
                  <div className="mb-3 rounded-lg bg-blue-50 p-2">
                    <p className="text-xs text-blue-600">Assigned Route</p>
                    <p className="text-sm font-medium text-blue-900">
                      {bus.routeId.name} ({bus.routeId.code})
                    </p>
                  </div>
                )}

                {bus.driverId && (
                  <div className="mb-3 rounded-lg bg-green-50 p-2">
                    <p className="text-xs text-green-600">Assigned Driver</p>
                    <p className="text-sm font-medium text-green-900">
                      {bus.driverId.profile?.firstName} {bus.driverId.profile?.lastName || bus.driverId.email}
                    </p>
                  </div>
                )}

                {(isAdmin || isOwner) && (
                  <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                    {isOwner && bus.approvalStatus === 'approved' && (
                      <button
                        onClick={(e) => toggleBusAvailability(bus._id, bus.currentStatus, e)}
                        disabled={updatingAvailability === bus._id}
                        className={`w-full rounded-lg py-2 text-sm font-semibold transition-all ${
                          bus.currentStatus === 'available'
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } ${updatingAvailability === bus._id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {updatingAvailability === bus._id ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : bus.currentStatus === 'available' ? (
                          '🔴 Mark as Unavailable'
                        ) : (
                          '🟢 Mark as Available'
                        )}
                      </button>
                    )}
                    <div className="flex gap-2">
                      <Link
                        href={`/buses/${bus._id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 rounded-lg bg-blue-100 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-200 text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBus(bus);
                          setShowDeleteModal(true);
                        }}
                        className="flex-1 rounded-lg bg-red-100 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Bus</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete bus <span className="font-bold">{selectedBus.registrationNumber}</span>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedBus(null);
                }}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/buses/${selectedBus._id}`, {
                      method: 'DELETE',
                      headers: {
                        Authorization: `Bearer ${tokens?.accessToken}`,
                      },
                    });

                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || 'Failed to delete bus');
                    }

                    // Show success notification
                    setNotification({
                      type: 'success',
                      message: `Bus ${selectedBus.registrationNumber} deleted successfully!`
                    });
                    
                    // Hide notification after 3 seconds
                    setTimeout(() => setNotification(null), 3000);

                    // Refresh the bus list
                    await fetchBuses();
                    setShowDeleteModal(false);
                    setSelectedBus(null);
                  } catch (err) {
                    // Show error notification
                    setNotification({
                      type: 'error',
                      message: err instanceof Error ? err.message : 'Failed to delete bus'
                    });
                    
                    // Hide notification after 3 seconds
                    setTimeout(() => setNotification(null), 3000);
                    
                    setShowDeleteModal(false);
                    setSelectedBus(null);
                  }
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[300px] ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-semibold">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto hover:opacity-75 transition-opacity"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
