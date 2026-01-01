'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Driver {
  _id: string;
  fullName: string;
  licenseNumber: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  busType: string;
}

interface ConditionCheckItem {
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documents';
  item: string;
  status: 'good' | 'needs_attention' | 'critical';
  notes?: string;
}

interface ConditionReport {
  _id: string;
  driverId: Driver;
  busId: Bus;
  reportDate: string;
  shiftType: string;
  overallCondition: string;
  checklistItems: ConditionCheckItem[];
  odometerReading: number;
  fuelLevel: number;
  images: string[];
  additionalNotes?: string;
  issuesReported: boolean;
  issueDescription?: string;
  urgency?: string;
  maintenanceRequired: boolean;
  estimatedRepairTime?: string;
  status: string;
  reviewedBy?: {
    _id: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, tokens } = useAuth();
  const [report, setReport] = useState<ConditionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['ADMIN', 'OWNER', 'admin', 'owner'];
    if (user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    if (params.id) {
      fetchReport();
    }
  }, [isAuthenticated, user, router, params.id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/condition-reports/${params.id}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      setReport(data.report);
      setNewStatus(data.report.status);
      setReviewNotes(data.report.reviewNotes || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/condition-reports/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      await fetchReport();
      setShowUpdateModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      action_taken: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-green-600',
      good: 'text-blue-600',
      fair: 'text-yellow-600',
      poor: 'text-red-600',
    };
    return colors[condition] || 'text-gray-600';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      exterior: '🚌',
      interior: '🪑',
      mechanical: '⚙️',
      safety: '🛡️',
      documents: '📄',
    };
    return icons[category] || '📋';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow text-center">
          <svg className="mx-auto h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Report</h2>
          <p className="mt-2 text-gray-600">{error || 'Report not found'}</p>
          <button
            onClick={() => router.push('/admin/reports')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/reports')}
              className="mb-2 flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Reports
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Condition Report Details</h1>
            <p className="text-gray-600">Report ID: {report._id}</p>
          </div>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Update Status
          </button>
        </div>

        {/* Report Overview */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  {report.busId.registrationNumber}
                </h2>
                {getStatusBadge(report.status)}
              </div>
              <div className="grid gap-2 text-sm text-gray-600">
                <p><strong>Driver:</strong> {report.driverId.fullName} ({report.driverId.licenseNumber})</p>
                <p><strong>Bus Type:</strong> {report.busId.busType}</p>
                <p><strong>Shift:</strong> {report.shiftType.charAt(0).toUpperCase() + report.shiftType.slice(1)}</p>
                <p><strong>Report Date:</strong> {new Date(report.reportDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Overall Condition</p>
              <p className={`text-4xl font-bold capitalize ${getConditionColor(report.overallCondition)}`}>
                {report.overallCondition}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">Odometer Reading</p>
              <p className="text-2xl font-bold text-gray-900">{report.odometerReading} km</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-gray-600">Fuel Level</p>
              <p className="text-2xl font-bold text-gray-900">{report.fuelLevel}%</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-gray-600">Checklist</p>
              <p className="text-2xl font-bold text-gray-900">
                {report.checklistItems?.filter(i => i.status === 'good').length || 0} / {report.checklistItems?.length || 0}
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">
                {report.maintenanceRequired ? 'Required' : 'Not Required'}
              </p>
            </div>
          </div>
        </div>

        {/* Issues Alert */}
        {report.issuesReported && (
          <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">
                  Issue Reported - {report.urgency?.toUpperCase()} Priority
                </h3>
                <p className="mt-2 text-red-800">{report.issueDescription}</p>
                {report.estimatedRepairTime && (
                  <p className="mt-2 text-sm text-red-700">
                    <strong>Estimated Repair Time:</strong> {report.estimatedRepairTime}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checklist Details */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Inspection Checklist</h3>
          
          {['exterior', 'interior', 'mechanical', 'safety', 'documents'].map((category) => {
            const items = report.checklistItems?.filter(item => item.category === category) || [];
            if (items.length === 0) return null;
            
            return (
              <div key={category} className="mb-6">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <span>{getCategoryIcon(category)}</span>
                  <span className="capitalize">{category}</span>
                </h4>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${
                        item.status === 'good'
                          ? 'border-green-200 bg-green-50'
                          : item.status === 'needs_attention'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{item.item}</span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'good'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'needs_attention'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status === 'good' ? 'Good' : item.status === 'needs_attention' ? 'Needs Attention' : 'Critical'}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Notes */}
        {report.additionalNotes && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-gray-900">Additional Notes</h3>
            <p className="text-gray-700">{report.additionalNotes}</p>
          </div>
        )}

        {/* Review Information */}
        {report.reviewedBy && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-3 text-xl font-bold text-gray-900">Review Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Reviewed By:</strong> {report.reviewedBy.email}</p>
              <p><strong>Reviewed At:</strong> {new Date(report.reviewedAt!).toLocaleString()}</p>
              {report.reviewNotes && (
                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Review Notes:</p>
                  <p className="mt-1 text-gray-700">{report.reviewNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Update Report Status</h3>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="action_taken">Action Taken</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                rows={4}
                placeholder="Add your review notes..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
