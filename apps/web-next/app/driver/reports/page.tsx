'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ConditionReport {
  _id: string;
  busId: { registrationNumber: string; busType: string };
  reportDate: string;
  shiftType: string;
  overallCondition: string;
  issuesReported: boolean;
  maintenanceRequired: boolean;
  status: string;
  urgency?: string;
}

export default function DriverReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'driver')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'driver') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch('/api/condition-reports', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'issues') return report.issuesReported;
    if (filter === 'maintenance') return report.maintenanceRequired;
    return report.status === filter;
  });

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Condition Reports</h1>
            <p className="mt-2 text-gray-600">View and manage bus condition reports</p>
          </div>
          <Link
            href="/driver/reports/new"
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Reports' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'issues', label: 'With Issues' },
            { value: 'maintenance', label: 'Needs Maintenance' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report._id}
              className="rounded-lg bg-white p-6 shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/driver/reports/${report._id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.busId.registrationNumber}
                    </h3>
                    <span className="text-sm text-gray-500">{report.busId.busType}</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      report.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                      report.overallCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                      report.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.overallCondition}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>📅 {new Date(report.reportDate).toLocaleDateString()}</span>
                    <span>🕐 {report.shiftType}</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      report.status === 'submitted' ? 'bg-gray-100 text-gray-800' :
                      report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      report.status === 'action_taken' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-3">
                    {report.issuesReported && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        report.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        report.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        report.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        ⚠️ Issues Reported
                      </span>
                    )}
                    {report.maintenanceRequired && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                        🔧 Maintenance Required
                      </span>
                    )}
                  </div>
                </div>

                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <p className="text-gray-500">No reports found</p>
              <Link
                href="/driver/reports/new"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Create First Report
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
