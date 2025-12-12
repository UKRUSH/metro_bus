'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  _id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Driver {
  _id: string;
  userId: string;
  fullName: string;
  nicNumber: string;
  dateOfBirth?: string;
  gender?: string;
  permanentAddress: string;
  currentAddress?: string;
  mobileNumber: string;
  email: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  licenseType?: string;
  licenseIssuedDistrict?: string;
  licenseFrontImageUrl?: string;
  licenseBackImageUrl?: string;
  profilePhotoUrl?: string;
  status: string;
  assignedBusId?: string;
  experienceYears?: number;
  rating?: number;
  totalTrips?: number;
}

interface Owner {
  _id: string;
  userId: string;
  ownerType: string;
  fullName?: string;
  companyName?: string;
  status: string;
  mobileNumber: string;
  email: string;
  totalBuses: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'drivers' | 'owners'>('all');
  const [filter, setFilter] = useState({
    role: '',
    status: '',
    search: '',
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const headers = {
        'Authorization': `Bearer ${tokens?.accessToken}`,
        'Content-Type': 'application/json',
      };

      // Fetch users
      const usersRes = await fetch('/api/users?limit=1000', { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data?.users || usersData.users || []);
      }

      // Fetch drivers
      const driversRes = await fetch('/api/drivers', { headers });
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData.drivers || []);
      }

      // Fetch owners
      const ownersRes = await fetch('/api/owners', { headers });
      if (ownersRes.ok) {
        const ownersData = await ownersRes.json();
        setOwners(ownersData.owners || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch(`/api/drivers/${driverId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Driver approved successfully');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve driver');
      }
    } catch (error) {
      console.error('Error approving driver:', error);
      alert('Failed to approve driver');
    }
  };

  const handleApproveOwner = async (ownerId: string) => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch(`/api/owners/${ownerId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Owner approved successfully');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve owner');
      }
    } catch (error) {
      console.error('Error approving owner:', error);
      alert('Failed to approve owner');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u => {
    if (filter.role && u.role !== filter.role) return false;
    if (filter.search && !u.email.toLowerCase().includes(filter.search.toLowerCase()) && 
        !`${u.profile.firstName} ${u.profile.lastName}`.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const pendingDrivers = drivers.filter(d => d.status === 'pending');
  const pendingOwners = owners.filter(o => o.status === 'pending');

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Manage all users, drivers, and bus owners</p>
        </div>

        {/* Pending Approvals Alert */}
        {(pendingDrivers.length > 0 || pendingOwners.length > 0) && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Pending Approvals</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {pendingDrivers.length > 0 && `${pendingDrivers.length} driver(s) `}
                    {pendingDrivers.length > 0 && pendingOwners.length > 0 && 'and '}
                    {pendingOwners.length > 0 && `${pendingOwners.length} owner(s) `}
                    waiting for approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'drivers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Drivers ({drivers.length})
              {pendingDrivers.length > 0 && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  {pendingDrivers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'owners'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Bus Owners ({owners.length})
              {pendingOwners.length > 0 && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  {pendingOwners.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            {activeTab === 'all' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filter.role}
                  onChange={(e) => setFilter({ ...filter, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="driver">Driver</option>
                  <option value="finance">Finance</option>
                  <option value="passenger">Passenger</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'all' && (
          <div className="rounded-lg bg-white shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile.firstName} {user.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'owner' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'driver' ? 'bg-green-100 text-green-800' :
                        user.role === 'finance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.profile.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        className={`${
                          user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver._id} className="rounded-lg bg-white shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{driver.fullName}</h3>
                    <p className="text-sm text-gray-500">{driver.email}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    driver.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    driver.status === 'approved' ? 'bg-green-100 text-green-800' :
                    driver.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {driver.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Personal Info</h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">NIC:</span> {driver.nicNumber}</p>
                      <p className="text-sm"><span className="font-medium">DOB:</span> {driver.dateOfBirth ? new Date(driver.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Gender:</span> {driver.gender || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact</h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Mobile:</span> {driver.mobileNumber}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {driver.email}</p>
                      {driver.emergencyContactName && (
                        <p className="text-sm"><span className="font-medium">Emergency:</span> {driver.emergencyContactName} ({driver.emergencyContactNumber})</p>
                      )}
                    </div>
                  </div>

                  {/* License Information */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">License</h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Number:</span> {driver.licenseNumber}</p>
                      <p className="text-sm"><span className="font-medium">Type:</span> {driver.licenseType || 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Expiry:</span> {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}</p>
                      {driver.licenseIssuedDistrict && (
                        <p className="text-sm"><span className="font-medium">District:</span> {driver.licenseIssuedDistrict}</p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Address</h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="font-medium">Permanent:</span> {driver.permanentAddress}</p>
                      {driver.currentAddress && driver.currentAddress !== driver.permanentAddress && (
                        <p className="text-sm"><span className="font-medium">Current:</span> {driver.currentAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="md:col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Document Status</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`border rounded-lg p-3 text-center ${driver.licenseFrontImageUrl && !driver.licenseFrontImageUrl.includes('placeholder') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex flex-col items-center justify-center h-20">
                          {driver.licenseFrontImageUrl && !driver.licenseFrontImageUrl.includes('placeholder') ? (
                            <>
                              <svg className="w-8 h-8 text-green-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-green-700 font-medium">Uploaded</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-gray-500 font-medium">Pending</p>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">License Front</p>
                      </div>
                      
                      <div className={`border rounded-lg p-3 text-center ${driver.licenseBackImageUrl && !driver.licenseBackImageUrl.includes('placeholder') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex flex-col items-center justify-center h-20">
                          {driver.licenseBackImageUrl && !driver.licenseBackImageUrl.includes('placeholder') ? (
                            <>
                              <svg className="w-8 h-8 text-green-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-green-700 font-medium">Uploaded</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-gray-500 font-medium">Pending</p>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">License Back</p>
                      </div>
                      
                      <div className={`border rounded-lg p-3 text-center ${driver.profilePhotoUrl && !driver.profilePhotoUrl.includes('placeholder') ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex flex-col items-center justify-center h-20">
                          {driver.profilePhotoUrl && !driver.profilePhotoUrl.includes('placeholder') ? (
                            <>
                              <svg className="w-8 h-8 text-green-600 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-green-700 font-medium">Uploaded</p>
                            </>
                          ) : (
                            <>
                              <svg className="w-8 h-8 text-gray-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <p className="text-xs text-gray-500 font-medium">Pending</p>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Profile Photo</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Note: Document upload feature will be implemented with cloud storage (Cloudinary/AWS S3)</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  {driver.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApproveDriver(driver._id)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Approve Driver
                      </button>
                      <button
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {driver.status === 'approved' && (
                    <span className="text-sm text-gray-500">Approved - Waiting for activation</span>
                  )}
                  <button
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {drivers.length === 0 && (
              <div className="rounded-lg bg-white shadow p-8 text-center">
                <p className="text-gray-500">No drivers found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'owners' && (
          <div className="rounded-lg bg-white shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {owners.map((owner) => (
                  <tr key={owner._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {owner.fullName || owner.companyName}
                        </div>
                        <div className="text-sm text-gray-500">{owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                        {owner.ownerType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {owner.mobileNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {owner.totalBuses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        owner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        owner.status === 'approved' ? 'bg-green-100 text-green-800' :
                        owner.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {owner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {owner.status === 'pending' && (
                        <button
                          onClick={() => handleApproveOwner(owner._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
