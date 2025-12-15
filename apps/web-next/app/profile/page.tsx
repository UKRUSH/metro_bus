'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface UserData {
  _id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
    address?: string;
    avatar?: string;
    emergencyContact?: string;
  };
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface DriverData {
  _id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  status: string;
  currentBus?: string;
}

interface OwnerData {
  _id: string;
  userId: string;
  businessName: string;
  businessRegistration: string;
  businessAddress: string;
  status: string;
  totalBuses?: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, isAuthenticated, tokens } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'roleInfo' | 'security'>('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authUser && tokens) {
      fetchUserProfile();
      fetchRoleBasedData();
    }
  }, [authUser, tokens]);

  const fetchRoleBasedData = async () => {
    if (!authUser || !tokens) return;

    const userId = (authUser as any)?.id || authUser?._id;
    
    try {
      // Fetch driver data if user is a driver
      if (authUser.role === 'driver') {
        const response = await fetch('/api/drivers', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          const driver = data.data.drivers.find((d: any) => d.userId === userId);
          setDriverData(driver || null);
        }
      }
      
      // Fetch owner data if user is an owner
      if (authUser.role === 'owner') {
        const response = await fetch('/api/owners', {
          headers: { 'Authorization': `Bearer ${tokens.accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          const owner = data.data.owners.find((o: any) => o.userId === userId);
          setOwnerData(owner || null);
        }
      }
    } catch (error) {
      console.error('Error fetching role data:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('=== Profile Fetch Started ===');
      console.log('Auth User:', authUser);
      console.log('Has Token:', !!tokens?.accessToken);
      
      // Support both id and _id fields
      const userId = (authUser as any)?.id || authUser?._id;
      console.log('User ID:', userId);
      
      if (!userId) {
        setError('No user ID found. Please log in again.');
        return;
      }
      
      if (!tokens?.accessToken) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      console.log('Response Status:', response.status, response.statusText);
      console.log('Response OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        
        // Handle different response structures
        if (data.data && data.data.user) {
          setUser(data.data.user);
          console.log('User set successfully');
        } else if (data.user) {
          setUser(data.user);
          console.log('User set successfully');
        } else {
          console.error('Invalid response structure:', data);
          setError('Invalid response format from server');
        }
      } else {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          console.log('Error response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Error response data:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            const textError = await response.text();
            console.error('Error response text:', textError);
            errorMessage = textError || errorMessage;
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== Profile Fetch Completed ===');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !tokens) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem('auth_tokens');
        router.push('/login');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          {error ? (
            <div className="max-w-md mx-auto">
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <svg className="h-8 w-8 text-red-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button
                onClick={fetchUserProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Loading profile...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.profile.avatar ? (
                      <img
                        src={user.profile.avatar}
                        alt="Avatar"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span>
                        {user.profile.firstName.charAt(0)}{user.profile.lastName.charAt(0)}
                      </span>
                    )}
                  </div>
                  {user.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name & Role */}
                <h2 className="text-xl font-bold text-gray-900">
                  {user.profile.firstName} {user.profile.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1 mb-3">{user.email}</p>
                
                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-sm font-medium mb-4">
                  {user.role === 'driver' && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                    </svg>
                  )}
                  {user.role === 'owner' && (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                  )}
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    user.isActive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      user.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></span>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Quick Info */}
                <div className="space-y-2 mb-6 text-left">
                  <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg bg-gray-50">
                    <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-700">{user.profile.phone}</span>
                  </div>

                  {user.profile.dateOfBirth && (
                    <div className="flex items-center gap-3 text-sm p-2.5 rounded-lg bg-gray-50">
                      <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700">{new Date(user.profile.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}

                  {user.profile.address && (
                    <div className="flex items-start gap-3 text-sm p-2.5 rounded-lg bg-gray-50">
                      <svg className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-700">{user.profile.address}</span>
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                <Link
                  href="/profile/edit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6 bg-white rounded-lg shadow border border-gray-200">
              <nav className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Info
                </button>
                {(user.role === 'driver' || user.role === 'owner') && (
                  <button
                    onClick={() => setActiveTab('roleInfo')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'roleInfo'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {user.role === 'driver' ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {user.role === 'driver' ? 'Driver Details' : 'Business Details'}
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'security'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Email Address</p>
                    <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                  </div>

                  {/* Phone */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Phone Number</p>
                    <p className="text-sm font-semibold text-gray-900">{user.profile.phone}</p>
                  </div>

                  {/* Emergency Contact */}
                  {user.profile.emergencyContact && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Emergency Contact</p>
                      <p className="text-sm font-semibold text-gray-900">{user.profile.emergencyContact}</p>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {user.profile.dateOfBirth && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Date of Birth</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(user.profile.dateOfBirth).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}

                  {/* Account Status */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Account Status</p>
                    <span className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      user.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Verification */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Verification</p>
                    <span className={`text-sm font-semibold ${
                      user.isVerified ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {user.isVerified ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>

                  {/* Member Since */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 md:col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Member Since</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {/* Address */}
                  {user.profile.address && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Address</p>
                      <p className="text-sm font-semibold text-gray-900">{user.profile.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Role-Based Information Tab */}
            {activeTab === 'roleInfo' && user.role === 'driver' && (
              <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Driver Information</h3>
                {driverData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">License Number</p>
                      <p className="text-sm font-semibold text-gray-900">{driverData.licenseNumber}</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">License Expiry</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(driverData.licenseExpiry).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Experience</p>
                      <p className="text-sm font-semibold text-gray-900">{driverData.experience} years</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                      <p className={`text-sm font-semibold capitalize ${
                        driverData.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{driverData.status}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No driver information found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'roleInfo' && user.role === 'owner' && (
              <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h3>
                {ownerData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Business Name</p>
                      <p className="text-sm font-semibold text-gray-900">{ownerData.businessName}</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Registration Number</p>
                      <p className="text-sm font-semibold text-gray-900">{ownerData.businessRegistration}</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 md:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Business Address</p>
                      <p className="text-sm font-semibold text-gray-900">{ownerData.businessAddress}</p>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                      <p className={`text-sm font-semibold capitalize ${
                        ownerData.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                      }`}>{ownerData.status}</p>
                    </div>

                    {ownerData.totalBuses !== undefined && (
                      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Buses</p>
                        <p className="text-sm font-semibold text-gray-900">{ownerData.totalBuses}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-gray-500 text-sm">No business information found</p>
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="rounded-lg bg-white p-6 shadow border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-4">
                  {/* Password Section */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Change Password</h4>
                        <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                      </div>
                      <Link
                        href="/profile/edit/password"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                      >
                        Change
                      </Link>
                    </div>
                  </div>

                  {/* Delete Account Section */}
                  <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">Delete Account</h4>
                        <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Account?</h3>
                <p className="text-sm text-gray-500">This action is permanent</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Are you absolutely sure you want to delete your account? All your data, including your profile, bookings, and season passes will be permanently removed and cannot be recovered.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
