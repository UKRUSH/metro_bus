
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';


interface Route {
  _id: string;
  name: string;
  code: string;
}

interface SeasonPass {
  _id: string;
  passType: 'monthly' | 'quarterly' | 'yearly';
  routeId?: Route;
  boardingStop?: string;
  alightingStop?: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'active' | 'expired' | 'suspended';
  usageCount: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  autoRenew: boolean;
  createdAt: string;
}

export default function SeasonPassesPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user } = useAuth();
  const [passes, setPasses] = useState<SeasonPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<SeasonPass | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [editFormData, setEditFormData] = useState({
    status: '',
    autoRenew: false,
    endDate: '',
  });
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    passType: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    routeId: '',
    status: 'active' as 'active' | 'expired' | 'suspended',
    autoRenew: false,
  });
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const generateQRCodeForPass = async (pass: SeasonPass): Promise<string> => {
    try {
      const qrData = {
        passId: pass._id,
        passType: pass.passType,
        routeId: pass.routeId?._id || 'all',
        routeName: pass.routeId?.name || 'All Routes',
        routeCode: pass.routeId?.code || 'ALL',
        boardingStop: pass.boardingStop || 'any',
        alightingStop: pass.alightingStop || 'any',
        startDate: pass.startDate,
        endDate: pass.endDate,
        status: pass.status,
        usageCount: pass.usageCount,
        price: pass.price,
      };

      const url = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      });

      return url;
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      return '';
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchPasses();
  }, [statusFilter, isAuthenticated, router]);

  const fetchPasses = async () => {
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

      const response = await fetch(`/api/season-passes?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch season passes');
      }

      const data = await response.json();
      const fetchedPasses = data.data.passes || [];
      setPasses(fetchedPasses);

      // Generate QR codes for all passes
      const qrCodePromises = fetchedPasses.map(async (pass: SeasonPass) => ({
        id: pass._id,
        url: await generateQRCodeForPass(pass),
      }));

      const qrCodeResults = await Promise.all(qrCodePromises);
      const qrCodeMap = qrCodeResults.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {} as Record<string, string>);

      setQrCodes(qrCodeMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPass || !tokens?.accessToken) return;

    try {
      const response = await fetch(`/api/season-passes/${selectedPass._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete season pass');
      }

      setPasses(passes.filter((p) => p._id !== selectedPass._id));
      setShowDeleteModal(false);
      setSelectedPass(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pass');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPass || !tokens?.accessToken) return;

    try {
      const response = await fetch(`/api/season-passes/${selectedPass._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to update season pass');
      }

      const data = await response.json();
      setPasses(passes.map((p) => (p._id === selectedPass._id ? data.data.seasonPass : p)));
      setShowEditModal(false);
      setSelectedPass(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pass');
    }
  };

  const openEditModal = (pass: SeasonPass) => {
    setSelectedPass(pass);
    setEditFormData({
      status: pass.status,
      autoRenew: pass.autoRenew,
      endDate: new Date(pass.endDate).toISOString().split('T')[0],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (pass: SeasonPass) => {
    setSelectedPass(pass);
    setShowDeleteModal(true);
  };

  const fetchRoutes = async () => {
    if (!tokens?.accessToken) return;

    try {
      const response = await fetch('/api/routes', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data.routes || []);
      }
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens?.accessToken) return;

    try {
      // Calculate dates and price based on pass type
      const startDate = new Date();
      const endDate = new Date(startDate);
      let basePrice = 0;

      switch (createFormData.passType) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          basePrice = 5000;
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + 3);
          basePrice = 13500;
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          basePrice = 48000;
          break;
      }

      // Route-specific passes are 30% of base price
      const price = createFormData.routeId ? Math.round(basePrice * 0.3) : basePrice;

      const response = await fetch('/api/season-passes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          userId: createFormData.userId,
          passType: createFormData.passType,
          routeId: createFormData.routeId || undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          price,
          status: createFormData.status,
          autoRenew: createFormData.autoRenew,
          paymentMethod: 'admin',
          paymentStatus: 'completed',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create season pass');
      }

      const data = await response.json();
      setPasses([data.data.seasonPass, ...passes]);
      setShowCreateModal(false);
      setCreateFormData({
        userId: '',
        passType: 'monthly',
        routeId: '',
        status: 'active',
        autoRenew: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pass');
    }
  };

  useEffect(() => {
    if (isAdmin && showCreateModal) {
      fetchRoutes();
    }
  }, [showCreateModal, isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPassTypeName = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'Monthly Pass';
      case 'quarterly':
        return 'Quarterly Pass';
      case 'yearly':
        return 'Yearly Pass';
      default:
        return type;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
                <h1 className="text-xl font-bold text-gray-900">My Season Passes</h1>
                <p className="text-sm text-gray-600">{passes.length} total passes</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Pass (Admin)
                </button>
              )}
              <Link
                href="/season-passes/purchase"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Purchase New Pass
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Stats (Admin Only) */}
        {isAdmin && passes.length > 0 && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-sm text-gray-600">Total Passes</p>
              <p className="text-2xl font-bold text-gray-900">{passes.length}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 shadow">
              <p className="text-sm text-green-600">Active</p>
              <p className="text-2xl font-bold text-green-700">
                {passes.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 shadow">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-700">
                {passes.filter((p) => p.status === 'expired').length}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 shadow">
              <p className="text-sm text-red-600">Suspended</p>
              <p className="text-2xl font-bold text-red-700">
                {passes.filter((p) => p.status === 'suspended').length}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'expired' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              statusFilter === 'suspended' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Suspended
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Error loading passes</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && passes.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">No season passes yet</h3>
            <p className="mt-2 text-gray-600">Purchase a season pass to save on travel</p>
            <Link
              href="/season-passes/purchase"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Purchase Season Pass
            </Link>
          </div>
        )}

        {!loading && !error && passes.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {passes.map((pass) => {
              const daysRemaining = getDaysRemaining(pass.endDate);
              const isActive = pass.status === 'active' && daysRemaining > 0;

              return (
                <div
                  key={pass._id}
                  className="relative rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow"
                >
                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(pass);
                        }}
                        className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(pass);
                        }}
                        className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Header */}
                  <div
                    className="mb-4 flex items-start justify-between cursor-pointer"
                    onClick={() => router.push(`/season-passes/${pass._id}`)}
                  >
                    <div className={isAdmin ? 'pr-20' : ''}>
                      <h3 className="text-lg font-bold text-gray-900">{getPassTypeName(pass.passType)}</h3>
                      <p className="text-sm text-gray-600">
                        {pass.routeId ? `${pass.routeId.name} (${pass.routeId.code})` : 'All Routes'}
                      </p>
                    </div>
                    {!isAdmin && (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(pass.status)}`}>
                        {pass.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="mb-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(pass.status)}`}>
                        {pass.status.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* QR Code */}
                  <div className="mb-4 flex justify-center">
                    {qrCodes[pass._id] ? (
                      <div className="rounded-lg bg-white p-3 shadow-sm border border-gray-200">
                        <img
                          src={qrCodes[pass._id]}
                          alt="Pass QR Code"
                          className="h-32 w-32"
                        />
                        <p className="mt-2 text-center text-xs text-gray-500">Scan on bus</p>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-100 p-3">
                        <div className="h-32 w-32 animate-pulse bg-gray-200 rounded"></div>
                      </div>
                    )}
                  </div>

                  {/* Validity */}
                  <div className="mb-4 rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Valid From</span>
                      <span className="font-semibold text-gray-900">{formatDate(pass.startDate)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">Valid Until</span>
                      <span className="font-semibold text-gray-900">{formatDate(pass.endDate)}</span>
                    </div>
                    {isActive && (
                      <div className="mt-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{daysRemaining}</p>
                        <p className="text-xs text-gray-600">Days Remaining</p>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{pass.usageCount}</p>
                      <p className="text-xs text-gray-600">Trips Made</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">LKR {pass.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">Price Paid</p>
                    </div>
                  </div>

                  {/* Auto-renew badge */}
                  {pass.autoRenew && (
                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Auto-Renew Enabled
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Modal (Admin Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Create Season Pass</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createFormData.userId}
                  onChange={(e) => setCreateFormData({ ...createFormData, userId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter user ID"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">MongoDB ObjectId of the user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pass Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={createFormData.passType}
                  onChange={(e) => setCreateFormData({ ...createFormData, passType: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="monthly">Monthly (LKR 5,000)</option>
                  <option value="quarterly">Quarterly (LKR 13,500)</option>
                  <option value="yearly">Yearly (LKR 48,000)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route (Optional)
                </label>
                <select
                  value={createFormData.routeId}
                  onChange={(e) => setCreateFormData({ ...createFormData, routeId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Routes</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Route-specific pass is 30% of base price</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={createFormData.status}
                  onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="createAutoRenew"
                  checked={createFormData.autoRenew}
                  onChange={(e) => setCreateFormData({ ...createFormData, autoRenew: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createAutoRenew" className="ml-2 text-sm text-gray-700">
                  Enable Auto-Renew
                </label>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The pass will start immediately and expire based on the selected pass type.
                  Payment status will be marked as completed.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  Create Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Season Pass</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={editFormData.endDate}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={editFormData.autoRenew}
                  onChange={(e) => setEditFormData({ ...editFormData, autoRenew: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoRenew" className="ml-2 text-sm text-gray-700">
                  Enable Auto-Renew
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Season Pass</h2>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700">
                <strong>{getPassTypeName(selectedPass.passType)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {selectedPass.routeId ? `${selectedPass.routeId.name}` : 'All Routes'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Valid until: {formatDate(selectedPass.endDate)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Delete Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
