'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'passes'>('profile');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            <Link
              href="/profile/edit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
                  {user.profile.avatar ? (
                    <img
                      src={user.profile.avatar}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.profile.firstName} {user.profile.lastName}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{user.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                  {user.role}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">{user.profile.phone}</span>
                </div>

                {user.profile.dateOfBirth && (
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">
                      {new Date(user.profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {user.profile.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <svg className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{user.profile.address}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/settings"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex gap-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`border-b-2 pb-4 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Profile Details
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`border-b-2 pb-4 text-sm font-medium ${
                    activeTab === 'bookings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setActiveTab('passes')}
                  className={`border-b-2 pb-4 text-sm font-medium ${
                    activeTab === 'passes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Season Passes
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900">{user.profile.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm font-medium text-gray-500">Account Status</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-sm font-medium text-gray-500">Verified</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-3">
                    <span className="text-sm font-medium text-gray-500">Member Since</span>
                    <span className="text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <p className="text-center text-gray-500 py-8">No bookings found</p>
              </div>
            )}

            {activeTab === 'passes' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Active Season Passes</h3>
                <p className="text-center text-gray-500 py-8">No active passes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
