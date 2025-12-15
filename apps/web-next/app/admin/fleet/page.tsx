'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  currentStatus: string;
  approvalStatus?: string;
  chassisNumber?: string;
  engineNumber?: string;
  routeNumbers?: string;
  insuranceType?: string;
  insuranceExpiryDate?: string;
  permitExpiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  ownerId?: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  driverId?: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  routeId?: {
    _id: string;
    name: string;
    code: string;
  };
  createdAt: string;
}

export default function AdminBusFleetPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsBus, setDetailsBus] = useState<Bus | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      localStorage.setItem('returnUrl', window.location.pathname);
      router.replace('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    fetchBuses();
  }, [authLoading, isAuthenticated, user, router, tokens]);

  useEffect(() => {
    if (statusFilter || searchTerm) {
      fetchBuses();
    }
  }, [statusFilter, searchTerm]);

  const fetchBuses = async () => {
    if (!tokens?.accessToken) {
      console.log('No access token available yet');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/buses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch buses (${response.status})`);
      }

      const data = await response.json();
      console.log('Fetched buses:', data);
      setBuses(data.data?.buses || data.buses || []);
    } catch (err: any) {
      console.error('Error fetching buses:', err);
      // Don't throw error in UI, just log it
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-service':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getApprovalColor = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusCounts = () => {
    return {
      total: buses.length,
      pending: buses.filter(b => b.currentStatus === 'pending').length,
      available: buses.filter(b => b.currentStatus === 'available').length,
      inService: buses.filter(b => b.currentStatus === 'in-service').length,
      maintenance: buses.filter(b => b.currentStatus === 'maintenance').length,
      rejected: buses.filter(b => b.currentStatus === 'rejected').length,
      retired: buses.filter(b => b.currentStatus === 'retired').length,
      totalCapacity: buses.reduce((sum, b) => sum + b.capacity, 0),
      needingMaintenance: buses.filter(b => {
        if (!b.nextMaintenanceDate) return false;
        const daysUntil = Math.floor((new Date(b.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30;
      }).length,
    };
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch = 
      bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.busType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bus.manufacturer?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || bus.currentStatus === statusFilter;
    const matchesApproval = !approvalFilter || bus.approvalStatus === approvalFilter;

    return matchesSearch && matchesStatus && matchesApproval;
  });

  const counts = getStatusCounts();

  const handleApprove = (bus: Bus) => {
    setSelectedBus(bus);
    setModalAction('approve');
    setShowModal(true);
  };

  const handleReject = (bus: Bus) => {
    setSelectedBus(bus);
    setModalAction('reject');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleModalConfirm = async () => {
    if (!selectedBus) {
      console.error('No bus selected');
      return;
    }

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      setNotification({ type: 'error', message: 'Please provide a reason for rejection' });
      return;
    }

    if (!tokens?.accessToken) {
      console.error('No access token available');
      setNotification({ type: 'error', message: 'Authentication token not available. Please log in again.' });
      return;
    }

    try {
      console.log('Submitting approval request:', {
        busId: selectedBus._id,
        action: modalAction,
        hasReason: modalAction === 'reject' ? !!rejectionReason : 'N/A',
      });

      const requestBody = {
        action: modalAction,
        ...(modalAction === 'reject' && { rejectionReason }),
      };

      console.log('Request body:', requestBody);

      const response = await fetch(`/api/buses/${selectedBus._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || `Failed to ${modalAction} bus (${response.status})`);
      }

      const result = await response.json();
      console.log('Success response:', result);

      setNotification({
        type: 'success',
        message: `Bus ${modalAction === 'approve' ? 'approved' : 'rejected'} successfully!`,
      });

      // Close modal and refresh buses
      setShowModal(false);
      setSelectedBus(null);
      setRejectionReason('');
      await fetchBuses();

      // Auto-dismiss notification
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error(`Error ${modalAction}ing bus:`, error);
      setNotification({
        type: 'error',
        message: error.message || `Failed to ${modalAction} bus`,
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedBus(null);
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <button className="rounded-lg p-2 hover:bg-gray-100 transition-colors">
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bus Fleet Management</h1>
                <p className="text-sm text-gray-600">Manage and monitor all buses</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/buses/approve">
                <button className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600 transition-colors">
                  Pending Approval ({counts.pending})
                </button>
              </Link>
              <Link href="/buses/new">
                <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
                  Add Bus
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Statistics Dashboard */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Buses</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
                <p className="text-xs text-gray-500 mt-1">{counts.totalCapacity} seats</p>
              </div>
              <div className="text-4xl">🚌</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Operational</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{counts.available + counts.inService}</p>
                <p className="text-xs text-gray-500 mt-1">{counts.available} available</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Maintenance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{counts.maintenance}</p>
                <p className="text-xs text-gray-500 mt-1">{counts.needingMaintenance} need attention</p>
              </div>
              <div className="text-4xl">🔧</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{counts.pending}</p>
                <p className="text-xs text-gray-500 mt-1">{counts.rejected} rejected</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Registration, manufacturer, type..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="available">Available</option>
                <option value="in-service">In Service</option>
                <option value="maintenance">Maintenance</option>
                <option value="rejected">Rejected</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Approval</label>
              <select
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter || approvalFilter) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">
                Showing {filteredBuses.length} of {buses.length} buses
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setApprovalFilter('');
                }}
                className="ml-auto rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Bus List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-lg shadow">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading fleet data...</p>
            </div>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow border border-dashed border-gray-300">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No buses found</h3>
            <p className="mt-2 text-sm text-gray-600">Try adjusting your filters or search criteria</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Bus Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Owner & Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Maintenance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBuses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{bus.registrationNumber}</p>
                          <p className="text-sm text-gray-600">{bus.busType} • {bus.capacity} seats</p>
                          {bus.manufacturer && (
                            <p className="text-xs text-gray-500 mt-1">
                              {bus.manufacturer} {bus.busModel}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {bus.ownerId ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {bus.ownerId.profile?.firstName || bus.ownerId.email}
                              </p>
                              <p className="text-xs text-gray-500">{bus.ownerId.email}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No owner</span>
                          )}
                          {bus.routeId ? (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-gray-900">
                                {bus.routeId.name} ({bus.routeId.code})
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No route assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium border ${getStatusColor(bus.currentStatus)}`}>
                            {bus.currentStatus.replace('-', ' ').toUpperCase()}
                          </span>
                          {bus.approvalStatus && (
                            <span className={`block rounded-full px-1.5 py-0.5 text-xs font-medium border ${getApprovalColor(bus.approvalStatus)}`}>
                              {bus.approvalStatus.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {bus.nextMaintenanceDate ? (
                          <div>
                            <p className="text-xs text-gray-500">Next Service:</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(bus.nextMaintenanceDate).toLocaleDateString()}
                            </p>
                            {(() => {
                              const daysUntil = Math.floor((new Date(bus.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                              if (daysUntil <= 7) {
                                return <p className="text-xs text-red-600 font-medium mt-1">Urgent</p>;
                              } else if (daysUntil <= 30) {
                                return <p className="text-xs text-orange-600 font-medium mt-1">Soon</p>;
                              }
                              return <p className="text-xs text-green-600 font-medium mt-1">Scheduled</p>;
                            })()}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {(!bus.approvalStatus || bus.approvalStatus === 'pending') ? (
                            <>
                              <button
                                onClick={() => handleApprove(bus)}
                                className="w-full rounded-md border border-green-600 bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 hover:border-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(bus)}
                                className="w-full rounded-md border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 hover:border-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic text-center py-1">
                              {bus.approvalStatus === 'approved' ? 'Approved' : bus.approvalStatus === 'rejected' ? 'Rejected' : 'No actions'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setDetailsBus(bus);
                            setShowDetailsModal(true);
                          }}
                          className="w-full rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 hover:border-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuses.map((bus) => (
              <div key={bus._id} className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bus.registrationNumber}</h3>
                      <p className="text-sm text-gray-600">{bus.busType}</p>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(bus.currentStatus)}`}>
                      {bus.currentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Capacity:</span>
                      <span className="text-sm font-medium text-gray-900">{bus.capacity} seats</span>
                    </div>
                    
                    {bus.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Make:</span>
                        <span className="text-sm font-medium text-gray-900">{bus.manufacturer}</span>
                      </div>
                    )}

                    {bus.ownerId && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">OWNER</p>
                        <p className="text-sm font-medium text-gray-900">{bus.ownerId.profile?.firstName || bus.ownerId.email}</p>
                      </div>
                    )}

                    {bus.routeId && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">ROUTE</p>
                        <p className="text-sm font-medium text-blue-600">{bus.routeId.name} ({bus.routeId.code})</p>
                      </div>
                    )}

                    {bus.nextMaintenanceDate && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">NEXT MAINTENANCE</p>
                        <p className="text-sm font-medium text-orange-600">
                          {new Date(bus.nextMaintenanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {(!bus.approvalStatus || bus.approvalStatus === 'pending') ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApprove(bus)}
                          className="w-full rounded-md border border-green-600 bg-green-600 text-white py-2 text-sm font-medium hover:bg-green-700 hover:border-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(bus)}
                          className="w-full rounded-md border border-red-600 bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700 hover:border-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-2 bg-gray-50 rounded-md">
                        <span className="text-sm font-medium text-gray-600">
                          {bus.approvalStatus === 'approved' ? 'Approved' : bus.approvalStatus === 'rejected' ? 'Rejected' : 'No actions available'}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setDetailsBus(bus);
                        setShowDetailsModal(true);
                      }}
                      className="w-full rounded-md border border-blue-600 bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 hover:border-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approval/Rejection Modal */}
      {showModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className={`p-5 border-b ${
              modalAction === 'approve' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <h2 className={`text-xl font-semibold ${
                modalAction === 'approve' ? 'text-green-900' : 'text-red-900'
              }`}>
                {modalAction === 'approve' ? 'Approve Bus' : 'Reject Bus'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedBus.registrationNumber}
              </p>
            </div>

            <div className="p-5">
              {modalAction === 'approve' ? (
                <div>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to approve this bus? It will be available for operation.
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">Bus:</span> {selectedBus.registrationNumber}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">Type:</span> {selectedBus.busType}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">Capacity:</span> {selectedBus.capacity} seats
                    </p>
                    {selectedBus.ownerId && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">Owner:</span> {selectedBus.ownerId.profile?.firstName || selectedBus.ownerId.email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-3">
                    Please provide a reason for rejecting this bus:
                  </p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason (required)..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[120px]"
                    autoFocus
                  />
                  {rejectionReason.trim() && (
                    <p className="text-sm text-gray-500 mt-2">
                      {rejectionReason.length} characters
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleModalConfirm}
                className={`flex-1 rounded-md py-2 font-medium text-white transition-colors ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
              <button
                onClick={handleModalClose}
                className="flex-1 rounded-md bg-white border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bus Details Modal */}
      {showDetailsModal && detailsBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-50 border-b border-blue-200 p-5 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-blue-900">Bus Details</h2>
                <p className="text-sm text-gray-600 mt-1">{detailsBus.registrationNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsBus(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="text-sm font-medium text-gray-900">{detailsBus.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bus Type</p>
                    <p className="text-sm font-medium text-gray-900">{detailsBus.busType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="text-sm font-medium text-gray-900">{detailsBus.capacity} seats</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Status</p>
                    <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium border ${getStatusColor(detailsBus.currentStatus)}`}>
                      {detailsBus.currentStatus.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  {detailsBus.approvalStatus && (
                    <div>
                      <p className="text-sm text-gray-500">Approval Status</p>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium border ${getApprovalColor(detailsBus.approvalStatus)}`}>
                        {detailsBus.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {detailsBus.manufacturer && (
                    <div>
                      <p className="text-sm text-gray-500">Manufacturer</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.manufacturer}</p>
                    </div>
                  )}
                  {detailsBus.busModel && (
                    <div>
                      <p className="text-sm text-gray-500">Model</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.busModel}</p>
                    </div>
                  )}
                  {detailsBus.chassisNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Chassis Number</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.chassisNumber}</p>
                    </div>
                  )}
                  {detailsBus.engineNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Engine Number</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.engineNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Information */}
              {detailsBus.ownerId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Owner Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {detailsBus.ownerId.profile?.firstName && detailsBus.ownerId.profile?.lastName
                          ? `${detailsBus.ownerId.profile.firstName} ${detailsBus.ownerId.profile.lastName}`
                          : detailsBus.ownerId.profile?.firstName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.ownerId.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Route Information */}
              {detailsBus.routeId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Route Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Route Name</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.routeId.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Route Code</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.routeId.code}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Information */}
              {detailsBus.driverId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Driver Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {detailsBus.driverId.profile?.firstName && detailsBus.driverId.profile?.lastName
                          ? `${detailsBus.driverId.profile.firstName} ${detailsBus.driverId.profile.lastName}`
                          : detailsBus.driverId.profile?.firstName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{detailsBus.driverId.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance & Permits */}
              {(detailsBus.insuranceType || detailsBus.insuranceExpiryDate || detailsBus.permitExpiryDate) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Insurance & Permits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsBus.insuranceType && (
                      <div>
                        <p className="text-sm text-gray-500">Insurance Type</p>
                        <p className="text-sm font-medium text-gray-900">{detailsBus.insuranceType}</p>
                      </div>
                    )}
                    {detailsBus.insuranceExpiryDate && (
                      <div>
                        <p className="text-sm text-gray-500">Insurance Expiry</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(detailsBus.insuranceExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {detailsBus.permitExpiryDate && (
                      <div>
                        <p className="text-sm text-gray-500">Permit Expiry</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(detailsBus.permitExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Maintenance Information */}
              {(detailsBus.lastMaintenanceDate || detailsBus.nextMaintenanceDate) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Maintenance Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsBus.lastMaintenanceDate && (
                      <div>
                        <p className="text-sm text-gray-500">Last Maintenance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(detailsBus.lastMaintenanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {detailsBus.nextMaintenanceDate && (
                      <div>
                        <p className="text-sm text-gray-500">Next Maintenance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(detailsBus.nextMaintenanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {(detailsBus.routeNumbers || detailsBus.createdAt) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsBus.routeNumbers && (
                      <div>
                        <p className="text-sm text-gray-500">Route Numbers</p>
                        <p className="text-sm font-medium text-gray-900">{detailsBus.routeNumbers}</p>
                      </div>
                    )}
                    {detailsBus.createdAt && (
                      <div>
                        <p className="text-sm text-gray-500">Registration Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(detailsBus.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsBus(null);
                }}
                className="w-full rounded-md bg-gray-600 py-2 font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] border ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-900 border-green-200' 
              : 'bg-red-50 text-red-900 border-red-200'
          }`}>
            <span className="text-lg">
              {notification.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="font-medium flex-1">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-auto hover:opacity-75 transition-opacity text-gray-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
