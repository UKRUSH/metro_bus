'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function StakeholdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  const stakeholderDashboards = [
    {
      title: 'Admin Dashboard',
      description: 'System-wide management and oversight',
      role: 'admin',
      href: '/admin',
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
      features: ['User Management', 'Bus Management', 'Route Management', 'Reports & Analytics'],
    },
    {
      title: 'Bus Owner Dashboard',
      description: 'Fleet management and revenue tracking',
      role: 'owner',
      href: '/owner',
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      color: 'from-green-500 to-emerald-600',
      features: ['My Buses', 'Revenue Tracking', 'Maintenance Schedule', 'Performance Reports'],
    },
    {
      title: 'Driver Dashboard',
      description: 'Trip logs and schedule management',
      role: 'driver',
      href: '/driver',
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'from-purple-500 to-pink-600',
      features: ['Daily Schedule', 'Trip Logging', 'Bus Condition Reports', 'Attendance'],
    },
    {
      title: 'Finance Dashboard',
      description: 'Financial operations and reporting',
      role: 'finance',
      href: '/finance',
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-yellow-500 to-orange-600',
      features: ['Payroll Processing', 'Commission Tracking', 'Revenue Reports', 'Tax Reports'],
    },
    {
      title: 'Passenger Dashboard',
      description: 'Book tickets and manage season passes',
      role: 'passenger',
      href: '/dashboard',
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
      features: ['Search Routes', 'Book Tickets', 'Season Passes', 'Trip History'],
    },
  ];

  const canAccessRole = (role: string) => {
    // Admin can access all dashboards
    if (user?.role === 'admin') return true;
    // Users can only access their own role dashboard
    return user?.role === role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stakeholder Dashboards</h1>
              <p className="mt-1 text-gray-600">Access different areas of the Metro Bus System</p>
            </div>
            <Link href="/dashboard" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {stakeholderDashboards.map((dashboard) => {
            const isAccessible = canAccessRole(dashboard.role);
            return (
              <div
                key={dashboard.href}
                className={`overflow-hidden rounded-xl bg-white shadow-lg transition-all ${
                  isAccessible ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`bg-linear-to-br ${dashboard.color} p-6 text-white`}>
                  <div className="mb-4">{dashboard.icon}</div>
                  <h2 className="mb-2 text-2xl font-bold">{dashboard.title}</h2>
                  <p className="text-sm text-white/90">{dashboard.description}</p>
                </div>

                <div className="p-6">
                  <h3 className="mb-3 font-semibold text-gray-900">Key Features:</h3>
                  <ul className="mb-6 space-y-2">
                    {dashboard.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <svg className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isAccessible ? (
                    <Link
                      href={dashboard.href}
                      className={`block w-full rounded-lg bg-linear-to-r ${dashboard.color} px-4 py-3 text-center font-semibold text-white transition-transform hover:scale-105`}
                    >
                      Access Dashboard →
                    </Link>
                  ) : (
                    <div className="w-full rounded-lg bg-gray-200 px-4 py-3 text-center font-semibold text-gray-500">
                      Access Restricted
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {user?.role === 'admin' && (
          <div className="mt-8 rounded-xl bg-blue-50 p-6">
            <div className="flex items-start">
              <svg className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold text-blue-900">Admin Access</h3>
                <p className="mt-1 text-sm text-blue-700">
                  As an administrator, you have access to all stakeholder dashboards for testing and support purposes.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
