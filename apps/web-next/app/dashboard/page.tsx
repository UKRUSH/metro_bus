'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Role-based dashboard navigation
  const getRoleDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'owner':
        return '/owner';
      case 'driver':
        return '/driver';
      case 'finance':
        return '/finance';
      default:
        return null;
    }
  };

  const roleDashboard = getRoleDashboard();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.profile.firstName}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/stakeholders"
                className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
              >
                All Dashboards
              </Link>
              {roleDashboard && (
                <Link
                  href={roleDashboard}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* User Info Card */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Your Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">
                {user.profile.firstName} {user.profile.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{user.profile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/search" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Search Routes</h3>
            <p className="text-sm text-gray-600">Find and book your bus ticket</p>
          </Link>

          <Link href="/bookings" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">My Bookings</h3>
            <p className="text-sm text-gray-600">View and manage your bookings</p>
          </Link>

          <Link href="/season-passes" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Season Passes</h3>
            <p className="text-sm text-gray-600">Manage your season passes</p>
          </Link>

          <Link href="/track" className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Track Bus</h3>
            <p className="text-sm text-gray-600">Real-time bus locations</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
