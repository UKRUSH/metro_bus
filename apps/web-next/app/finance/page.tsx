'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function FinanceDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'finance') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const financeModules = [
    {
      title: 'Payroll',
      description: 'Process driver and staff salaries',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/finance/payroll',
      color: 'green',
    },
    {
      title: 'Commissions',
      description: 'Track owner and driver commissions',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/finance/commissions',
      color: 'yellow',
    },
    {
      title: 'Revenue Reports',
      description: 'Daily, weekly, monthly earnings',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/finance/revenue',
      color: 'blue',
    },
    {
      title: 'Expenses',
      description: 'Maintenance and operational costs',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      ),
      href: '/finance/expenses',
      color: 'red',
    },
    {
      title: 'Tax Reports',
      description: 'Generate tax compliance reports',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/finance/tax-reports',
      color: 'purple',
    },
    {
      title: 'Payments',
      description: 'Process refunds and payouts',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      href: '/finance/payments',
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      green: { bg: 'bg-green-50', text: 'text-green-600' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
      red: { bg: 'bg-red-50', text: 'text-red-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="text-gray-600">Manage finances, payroll, and reports</p>
            </div>
            <Link href="/dashboard" className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              User View
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {financeModules.map((module) => {
            const colors = getColorClasses(module.color);
            return (
              <Link key={module.href} href={module.href} className={`rounded-xl ${colors.bg} p-6 shadow hover:shadow-lg transition-shadow`}>
                <div className={`mb-4 ${colors.text}`}>{module.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
