'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

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

interface ReviewedBy {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
}

interface ConditionCheckItem {
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documents';
  item: string;
  status: 'good' | 'needs_attention' | 'critical';
  notes?: string;
}

interface ConditionReport {
  _id: string;
  driverId: Driver | string;
  busId: Bus | string;
  reportDate: string;
  shiftType: 'morning' | 'afternoon' | 'evening' | 'night';
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
  checklistItems: ConditionCheckItem[];
  odometerReading: number;
  fuelLevel: number;
  images: string[];
  additionalNotes?: string;
  issuesReported: boolean;
  issueDescription?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  maintenanceRequired: boolean;
  estimatedRepairTime?: string;
  status: 'submitted' | 'reviewed' | 'action_taken' | 'resolved';
  reviewedBy?: ReviewedBy | string;
  reviewedAt?: string;
  reviewNotes?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [issuesFilter, setIssuesFilter] = useState<string>('all');

  useEffect(() => {
    console.log('Auth check - isAuthenticated:', isAuthenticated);
    console.log('User:', user);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['ADMIN', 'OWNER', 'admin', 'owner'];
    if (user && !allowedRoles.includes(user.role)) {
      console.log('Access denied. User role:', user.role);
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchReports();
  }, [isAuthenticated, user, router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/condition-reports', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const result = await response.json();
      console.log('Fetched reports:', result);
      
      const reportsData = result.reports || [];
      setReports(reportsData);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to change the report status to ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/condition-reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report status');
      }

      alert(`Report status updated to ${newStatus}`);
      await fetchReports();
    } catch (err: any) {
      console.error('Update status error:', err);
      alert('Error: ' + err.message);
    }
  };

  const getDriverName = (report: ConditionReport): string => {
    if (typeof report.driverId === 'object' && report.driverId) {
      return report.driverId.fullName || 'Unknown';
    }
    return 'Unknown';
  };

  const getBusInfo = (report: ConditionReport): string => {
    if (typeof report.busId === 'object' && report.busId) {
      return `${report.busId.registrationNumber} (${report.busId.busType})`;
    }
    return 'N/A';
  };

  const getConditionBadge = (condition: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return 'bg-gray-100 text-gray-800';
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      submitted: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      action_taken: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      getDriverName(report).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBusInfo(report).toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || report.urgency === urgencyFilter;
    const matchesIssues = 
      issuesFilter === 'all' || 
      (issuesFilter === 'yes' && report.issuesReported) ||
      (issuesFilter === 'no' && !report.issuesReported);

    return matchesSearch && matchesStatus && matchesUrgency && matchesIssues;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-2 text-white transition-all hover:scale-110 hover:shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Condition Reports Management
                </h1>
                <p className="text-gray-600 mt-1">Review and manage driver-submitted condition reports</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by driver, bus, or issue description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="action_taken">Action Taken</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Urgency</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <select
                  value={issuesFilter}
                  onChange={(e) => setIssuesFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Reports</option>
                  <option value="yes">With Issues</option>
                  <option value="no">No Issues</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Bus
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No condition reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {report._id.slice(-8)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.reportDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.reportDate).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getDriverName(report)}
                        </div>
                        {typeof report.driverId === 'object' && report.driverId?.licenseNumber && (
                          <div className="text-xs text-gray-500">
                            Lic: {report.driverId.licenseNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getBusInfo(report)}</div>
                        <div className="text-xs text-gray-500">
                          Odometer: {report.odometerReading.toLocaleString()} km
                        </div>
                        <div className="text-xs text-gray-500">
                          Fuel: {report.fuelLevel}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {report.shiftType.charAt(0).toUpperCase() + report.shiftType.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getConditionBadge(report.overallCondition)}`}>
                          {report.overallCondition.charAt(0).toUpperCase() + report.overallCondition.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {report.issuesReported ? (
                          <div>
                            <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800">
                              Yes
                            </span>
                            {report.issueDescription && (
                              <div className="text-xs text-gray-600 mt-1 max-w-xs truncate">
                                {report.issueDescription}
                              </div>
                            )}
                            {report.maintenanceRequired && (
                              <div className="text-xs text-orange-600 mt-1 font-medium">
                                🔧 Maintenance Required
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                            No Issues
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {report.urgency ? (
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getUrgencyBadge(report.urgency)}`}>
                            {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer ${getStatusBadge(report.status)}`}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="action_taken">Action Taken</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        {report.reviewedBy && typeof report.reviewedBy === 'object' && (
                          <div className="text-xs text-gray-500 mt-1">
                            By: {report.reviewedBy.profile?.firstName || report.reviewedBy.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <Link href={`/admin/reports/${report._id}`}>
                          <button className="text-blue-600 hover:text-blue-900 font-medium">
                            View Details
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Reports</div>
            <div className="text-3xl font-bold text-blue-600">{reports.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">With Issues</div>
            <div className="text-3xl font-bold text-red-600">
              {reports.filter(r => r.issuesReported).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Critical</div>
            <div className="text-3xl font-bold text-red-600">
              {reports.filter(r => r.urgency === 'critical').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Needs Maintenance</div>
            <div className="text-3xl font-bold text-orange-600">
              {reports.filter(r => r.maintenanceRequired).length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Pending Review</div>
            <div className="text-3xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'submitted').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Resolved</div>
            <div className="text-3xl font-bold text-green-600">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
