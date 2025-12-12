'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface Route {
  _id: string;
  name: string;
  code: string;
  origin: string;
  destination: string;
}

interface SeasonPass {
  _id: string;
  userId: User | string;
  routeId: Route | string;
  passType: 'monthly' | 'quarterly' | 'yearly';
  boardingStop?: string;
  alightingStop?: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  usageCount?: number;
  autoRenew?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSeasonPassesPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [passes, setPasses] = useState<SeasonPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [passTypeFilter, setPassTypeFilter] = useState<string>('all');

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

    fetchSeasonPasses();
  }, [isAuthenticated, user, router]);

  const fetchSeasonPasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/season-passes', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch season passes');
      }

      const result = await response.json();
      console.log('Fetched season passes:', result);
      
      const passesData = result.data?.passes || result.passes || [];
      setPasses(passesData);
    } catch (err: any) {
      console.error('Fetch season passes error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (passId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the pass status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/season-passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pass status');
      }

      alert(`Pass status updated to ${newStatus}`);
      await fetchSeasonPasses();
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleUpdatePaymentStatus = async (passId: string, newPaymentStatus: string) => {
    if (!confirm(`Are you sure you want to change the payment status to ${newPaymentStatus}?`)) return;

    try {
      const response = await fetch(`/api/season-passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }

      alert(`Payment status updated to ${newPaymentStatus}`);
      await fetchSeasonPasses();
    } catch (err: any) {
      console.error('Update payment status error:', err);
      alert('Error: ' + err.message);
    }
  };

  const getUserName = (pass: SeasonPass): string => {
    if (typeof pass.userId === 'object' && pass.userId) {
      const { firstName, lastName } = pass.userId.profile || {};
      return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  };

  const getRouteName = (pass: SeasonPass): string => {
    if (typeof pass.routeId === 'object' && pass.routeId) {
      return `${pass.routeId.name} (${pass.routeId.code})`;
    }
    return 'N/A';
  };

  const getPassTypeBadge = (type: string) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-purple-100 text-purple-800',
      yearly: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredPasses = passes.filter((pass) => {
    const matchesSearch = 
      getUserName(pass).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRouteName(pass).toLowerCase().includes(searchTerm.toLowerCase()) ||
      pass.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || pass.status === statusFilter;
    const matchesPassType = passTypeFilter === 'all' || pass.passType === passTypeFilter;

    return matchesSearch && matchesStatus && matchesPassType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading season passes...</p>
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
                  Season Pass Management
                </h1>
                <p className="text-gray-600 mt-1">Manage customer season passes and subscriptions</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by passenger, route, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <select
                  value={passTypeFilter}
                  onChange={(e) => setPassTypeFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Season Passes Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Pass ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Pass Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Validity Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPasses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No season passes found
                    </td>
                  </tr>
                ) : (
                  filteredPasses.map((pass) => (
                    <tr key={pass._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {pass._id.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(pass.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserName(pass)}
                        </div>
                        {typeof pass.userId === 'object' && pass.userId?.email && (
                          <div className="text-xs text-gray-500">{pass.userId.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getRouteName(pass)}</div>
                        {pass.boardingStop && pass.alightingStop && (
                          <div className="text-xs text-gray-500">
                            {pass.boardingStop} → {pass.alightingStop}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPassTypeBadge(pass.passType)}`}>
                          {pass.passType.charAt(0).toUpperCase() + pass.passType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(pass.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {new Date(pass.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">Rs. {pass.price}</div>
                        {pass.usageCount !== undefined && (
                          <div className="text-xs text-gray-500">Uses: {pass.usageCount}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={pass.status}
                          onChange={(e) => handleUpdateStatus(pass._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                            pass.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : pass.status === 'expired'
                              ? 'bg-gray-100 text-gray-800'
                              : pass.status === 'suspended'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="suspended">Suspended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={pass.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(pass._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${
                            pass.paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : pass.paymentStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : pass.paymentStatus === 'refunded'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Link href={`/admin/season-passes/${pass._id}`}>
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Passes</div>
            <div className="text-3xl font-bold text-blue-600">{passes.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Active</div>
            <div className="text-3xl font-bold text-green-600">
              {passes.filter(p => p.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Monthly</div>
            <div className="text-3xl font-bold text-blue-600">
              {passes.filter(p => p.passType === 'monthly').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Quarterly</div>
            <div className="text-3xl font-bold text-purple-600">
              {passes.filter(p => p.passType === 'quarterly').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-indigo-600">
              Rs. {passes.filter(p => p.paymentStatus === 'completed').reduce((sum, p) => sum + p.price, 0).toFixed(2)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
