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
  const { tokens, isAuthenticated, user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busTypeFilter, setBusTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isAdmin && !isOwner) {
      router.push('/dashboard');
      return;
    }

    fetchBuses();
  }, [isAuthenticated, isAdmin, isOwner, router, statusFilter, busTypeFilter, searchTerm]);

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
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Bus
            </button>
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Add Bus
            </button>
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
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(bus.status || bus.currentStatus)}`}>
                    {(bus.status || bus.currentStatus).replace('-', ' ').toUpperCase()}
                  </span>
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
                  <div className="mt-4 flex gap-2 border-t pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBus(bus);
                        setShowEditModal(true);
                      }}
                      className="flex-1 rounded-lg bg-blue-100 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-200"
                    >
                      Edit
                    </button>
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
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* TODO: Add Create, Edit, and Delete Modals */}
    </div>
  );
}
