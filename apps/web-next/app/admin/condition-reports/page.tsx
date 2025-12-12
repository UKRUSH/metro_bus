'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ConditionReport {
  _id: string;
  driverId: {
    fullName: string;
    licenseNumber: string;
  };
  busId: {
    registrationNumber: string;
    busType: string;
  };
  reportDate: string;
  shiftType: string;
  overallCondition: string;
  issuesReported: boolean;
  maintenanceRequired: boolean;
  status: string;
  urgency?: string;
  issueDescription?: string;
}

export default function AdminConditionReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('reviewed');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'owner'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'owner')) {
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

  const handleReview = async (reportId: string) => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch(`/api/condition-reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNotes,
        }),
      });

      if (response.ok) {
        alert('Report reviewed successfully!');
        setReviewingId(null);
        setReviewNotes('');
        fetchReports();
      }
    } catch (error) {
      console.error('Error reviewing report:', error);
      alert('Failed to review report');
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return report.status === 'submitted';
    if (filter === 'issues') return report.issuesReported;
    if (filter === 'maintenance') return report.maintenanceRequired;
    if (filter === 'critical') return report.urgency === 'critical' || report.urgency === 'high';
    return report.status === filter;
  });

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const pendingCount = reports.filter(r => r.status === 'submitted').length;
  const issuesCount = reports.filter(r => r.issuesReported).length;
  const maintenanceCount = reports.filter(r => r.maintenanceRequired).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Condition Reports Management</h1>
          <p className="mt-2 text-gray-600">Review and manage bus condition reports</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 shadow">
            <p className="text-sm text-yellow-700">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 shadow">
            <p className="text-sm text-red-700">With Issues</p>
            <p className="text-2xl font-bold text-red-900">{issuesCount}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 shadow">
            <p className="text-sm text-purple-700">Need Maintenance</p>
            <p className="text-2xl font-bold text-purple-900">{maintenanceCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: 'All Reports' },
            { value: 'pending', label: `Pending (${pendingCount})` },
            { value: 'issues', label: `Issues (${issuesCount})` },
            { value: 'maintenance', label: `Maintenance (${maintenanceCount})` },
            { value: 'critical', label: 'Critical/High' },
            { value: 'reviewed', label: 'Reviewed' },
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

        {/* Reports Table */}
        <div className="rounded-lg bg-white shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Bus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Alerts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredReports.map((report) => (
                <>
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{report.busId.registrationNumber}</div>
                      <div className="text-gray-500">{report.busId.busType}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{report.driverId.fullName}</div>
                      <div className="text-gray-500">{report.driverId.licenseNumber}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 capitalize">
                      {report.shiftType}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        report.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                        report.overallCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                        report.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.overallCondition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        {report.issuesReported && (
                          <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            report.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                            report.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            ⚠️ {report.urgency || 'issue'}
                          </span>
                        )}
                        {report.maintenanceRequired && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                            🔧 maintenance
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        report.status === 'submitted' ? 'bg-gray-100 text-gray-800' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                        report.status === 'action_taken' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/driver/reports/${report._id}`)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View
                        </button>
                        {report.status === 'submitted' && (
                          <button
                            onClick={() => setReviewingId(report._id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {reviewingId === report._id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Review Status
                            </label>
                            <select
                              value={reviewStatus}
                              onChange={(e) => setReviewStatus(e.target.value)}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            >
                              <option value="reviewed">Reviewed</option>
                              <option value="action_taken">Action Taken</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Review Notes
                            </label>
                            <textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={3}
                              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="Add your review notes..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(report._id)}
                              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                              Submit Review
                            </button>
                            <button
                              onClick={() => {
                                setReviewingId(null);
                                setReviewNotes('');
                              }}
                              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {filteredReports.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No reports found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
