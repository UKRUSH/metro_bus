'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ChecklistItem {
  category: string;
  item: string;
  status: string;
  notes?: string;
}

interface ConditionReport {
  _id: string;
  driverId: {
    fullName: string;
    licenseNumber: string;
    email: string;
    mobileNumber: string;
  };
  busId: {
    registrationNumber: string;
    busType: string;
    capacity: number;
  };
  reportDate: string;
  shiftType: string;
  overallCondition: string;
  checklistItems: ChecklistItem[];
  odometerReading: number;
  fuelLevel: number;
  additionalNotes?: string;
  issuesReported: boolean;
  issueDescription?: string;
  urgency?: string;
  maintenanceRequired: boolean;
  estimatedRepairTime?: string;
  status: string;
  reviewedBy?: {
    email: string;
    profile: { firstName: string; lastName: string };
  };
  reviewedAt?: string;
  reviewNotes?: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<ConditionReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchReport();
    }
  }, [user, params.id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch(`/api/condition-reports/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!report) {
    return <div className="flex min-h-screen items-center justify-center">Report not found</div>;
  }

  const groupedChecklist = report.checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Condition Report Details</h1>
        </div>

        {/* Header Info */}
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bus</h3>
              <p className="text-lg font-semibold text-gray-900">
                {report.busId.registrationNumber}
              </p>
              <p className="text-sm text-gray-600">{report.busId.busType} • {report.busId.capacity} seats</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Driver</h3>
              <p className="text-lg font-semibold text-gray-900">{report.driverId.fullName}</p>
              <p className="text-sm text-gray-600">License: {report.driverId.licenseNumber}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Shift</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(report.reportDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 capitalize">{report.shiftType} Shift</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Overall Condition</h3>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                report.overallCondition === 'excellent' ? 'bg-green-100 text-green-800' :
                report.overallCondition === 'good' ? 'bg-blue-100 text-blue-800' :
                report.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {report.overallCondition}
              </span>
            </div>
          </div>
        </div>

        {/* Readings */}
        <div className="rounded-lg bg-white p-6 shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Readings</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Odometer</p>
                <p className="text-lg font-semibold text-gray-900">{report.odometerReading.toLocaleString()} km</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-xl">⛽</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fuel Level</p>
                <p className="text-lg font-semibold text-gray-900">{report.fuelLevel}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        {Object.keys(groupedChecklist).length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inspection Checklist</h2>
            <div className="space-y-4">
              {Object.entries(groupedChecklist).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-2 font-medium capitalize text-gray-800">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{item.item}</p>
                          {item.notes && (
                            <p className="mt-1 text-sm text-gray-600">{item.notes}</p>
                          )}
                        </div>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${
                          item.status === 'good' ? 'bg-green-100 text-green-800' :
                          item.status === 'needs_attention' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues & Maintenance */}
        {(report.issuesReported || report.maintenanceRequired) && (
          <div className="rounded-lg bg-white p-6 shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Issues & Maintenance</h2>
            
            {report.issuesReported && (
              <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-semibold text-red-900">Issues Reported</h3>
                  {report.urgency && (
                    <span className={`ml-auto rounded-full px-2 py-1 text-xs font-semibold ${
                      report.urgency === 'critical' ? 'bg-red-200 text-red-900' :
                      report.urgency === 'high' ? 'bg-orange-200 text-orange-900' :
                      report.urgency === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                      'bg-blue-200 text-blue-900'
                    }`}>
                      {report.urgency} priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-red-800">{report.issueDescription}</p>
              </div>
            )}

            {report.maintenanceRequired && (
              <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <h3 className="font-semibold text-purple-900">Maintenance Required</h3>
                </div>
                {report.estimatedRepairTime && (
                  <p className="text-sm text-purple-800">Estimated time: {report.estimatedRepairTime}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional Notes */}
        {report.additionalNotes && (
          <div className="rounded-lg bg-white p-6 shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.additionalNotes}</p>
          </div>
        )}

        {/* Review Status */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Status</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              report.status === 'submitted' ? 'bg-gray-100 text-gray-800' :
              report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
              report.status === 'action_taken' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {report.status.replace('_', ' ')}
            </span>
          </div>

          {report.reviewedBy && (
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Reviewed by {report.reviewedBy.profile.firstName} {report.reviewedBy.profile.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(report.reviewedAt!).toLocaleString()}
              </p>
              {report.reviewNotes && (
                <p className="mt-2 text-sm text-gray-700">{report.reviewNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
