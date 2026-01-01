'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Bus {
  _id: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
}

interface ChecklistItem {
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documents';
  item: string;
  status: 'good' | 'needs_attention' | 'critical';
  notes?: string;
}

interface ConditionReport {
  _id: string;
  driverId: {
    _id: string;
    fullName: string;
    licenseNumber: string;
  };
  busId: {
    _id: string;
    registrationNumber: string;
    busType: string;
  };
  reportDate: string;
  shiftType: string;
  overallCondition: string;
  checklistItems: ChecklistItem[];
  odometerReading: number;
  fuelLevel: number;
  images: string[];
  additionalNotes?: string;
  issuesReported: boolean;
  issueDescription?: string;
  urgency?: string;
  maintenanceRequired: boolean;
  status: string;
}

const defaultChecklistItems: ChecklistItem[] = [
  // Exterior
  { category: 'exterior', item: 'Body condition', status: 'good', notes: '' },
  { category: 'exterior', item: 'Lights (headlights, tail lights)', status: 'good', notes: '' },
  { category: 'exterior', item: 'Mirrors', status: 'good', notes: '' },
  { category: 'exterior', item: 'Windshield & windows', status: 'good', notes: '' },
  { category: 'exterior', item: 'Tires & wheels', status: 'good', notes: '' },
  
  // Interior
  { category: 'interior', item: 'Seats condition', status: 'good', notes: '' },
  { category: 'interior', item: 'Cleanliness', status: 'good', notes: '' },
  { category: 'interior', item: 'Air conditioning/heating', status: 'good', notes: '' },
  { category: 'interior', item: 'Dashboard instruments', status: 'good', notes: '' },
  
  // Mechanical
  { category: 'mechanical', item: 'Engine performance', status: 'good', notes: '' },
  { category: 'mechanical', item: 'Brakes', status: 'good', notes: '' },
  { category: 'mechanical', item: 'Steering', status: 'good', notes: '' },
  { category: 'mechanical', item: 'Transmission', status: 'good', notes: '' },
  
  // Safety
  { category: 'safety', item: 'Fire extinguisher', status: 'good', notes: '' },
  { category: 'safety', item: 'First aid kit', status: 'good', notes: '' },
  { category: 'safety', item: 'Emergency exits', status: 'good', notes: '' },
  { category: 'safety', item: 'Seat belts', status: 'good', notes: '' },
  
  // Documents
  { category: 'documents', item: 'Registration', status: 'good', notes: '' },
  { category: 'documents', item: 'Insurance', status: 'good', notes: '' },
  { category: 'documents', item: 'Route permit', status: 'good', notes: '' },
];

export default function BusConditionPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [view, setView] = useState<'form' | 'history'>('form');
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignedBus, setAssignedBus] = useState<Bus | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(true);
  
  // Form state
  const [selectedBusId, setSelectedBusId] = useState('');
  const [shiftType, setShiftType] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(defaultChecklistItems);
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('50');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [issuesReported, setIssuesReported] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [maintenanceRequired, setMaintenanceRequired] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'driver' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchDriverProfile();
    if (view === 'history') {
      fetchReports();
    }
  }, [authLoading, isAuthenticated, user, router, view]);

  const fetchDriverProfile = async () => {
    if (!tokens?.accessToken) return;
    
    try {
      setLoadingDriver(true);
      
      // Fetch today's approved schedule assignment to get the assigned bus
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/drivers/schedule-assignments?status=approved&date=${today}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const assignments = data.data?.assignments || data.assignments || [];
        
        if (assignments.length > 0) {
          // Get the first approved assignment for today
          const assignment = assignments[0];
          const bus = assignment.busId;
          
          if (bus) {
            setAssignedBus(bus);
            setSelectedBusId(bus._id);
          } else {
            setError('No bus information found in your schedule. Please contact your administrator.');
          }
        } else {
          setError('No approved schedule assignment found for today. Please contact your administrator.');
        }
      } else {
        setError('Failed to load your schedule. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch driver schedule:', err);
      setError('Failed to load your assigned bus. Please try again.');
    } finally {
      setLoadingDriver(false);
    }
  };

  const fetchReports = async () => {
    if (!tokens?.accessToken) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/condition-reports', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBusId || !odometerReading) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/condition-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          busId: selectedBusId,
          shiftType,
          overallCondition,
          checklistItems,
          odometerReading: parseInt(odometerReading),
          fuelLevel: parseInt(fuelLevel),
          additionalNotes,
          issuesReported,
          issueDescription: issuesReported ? issueDescription : undefined,
          urgency: issuesReported ? urgency : undefined,
          maintenanceRequired,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess('Bus condition report submitted successfully!');
      
      // Reset form
      setShiftType('morning');
      setOverallCondition('good');
      setChecklistItems(defaultChecklistItems);
      setOdometerReading('');
      setFuelLevel('50');
      setAdditionalNotes('');
      setIssuesReported(false);
      setIssueDescription('');
      setUrgency('low');
      setMaintenanceRequired(false);

      // Switch to history view after 2 seconds
      setTimeout(() => {
        setView('history');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bus Condition Report</h1>
            <p className="text-gray-600">Submit daily bus condition checks</p>
          </div>
          <button
            onClick={() => router.push('/driver/dashboard')}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setView('form')}
            className={`rounded-lg px-6 py-2 font-semibold ${
              view === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Submit Report
          </button>
          <button
            onClick={() => setView('history')}
            className={`rounded-lg px-6 py-2 font-semibold ${
              view === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Report History
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Form View */}
        {view === 'form' && (
          <>
            {loadingDriver ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : !assignedBus ? (
              <div className="rounded-lg bg-yellow-50 p-6 text-center shadow">
                <svg className="mx-auto h-16 w-16 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">No Schedule for Today</h2>
                <p className="mt-2 text-gray-600">You don't have an approved schedule assignment for today.</p>
                <p className="mt-1 text-gray-600">Please check your schedule or contact your administrator.</p>
                <button
                  onClick={() => router.push('/driver/schedule')}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  View Schedule
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Basic Information</h2>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Bus
                      </label>
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-lg font-bold text-gray-900">{assignedBus.registrationNumber}</p>
                            <p className="text-sm text-gray-600">{assignedBus.busType} - {assignedBus.capacity} seats</p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">This is your currently assigned bus</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shift Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={shiftType}
                        onChange={(e) => setShiftType(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        required
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overall Condition <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={overallCondition}
                        onChange={(e) => setOverallCondition(e.target.value as any)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        required
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Odometer Reading (km) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={odometerReading}
                        onChange={(e) => setOdometerReading(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        placeholder="Enter odometer reading"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuel Level (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={fuelLevel}
                        onChange={(e) => setFuelLevel(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>0%</span>
                        <span className="font-semibold text-blue-600">{fuelLevel}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Inspection Checklist</h2>
                  
                  {['exterior', 'interior', 'mechanical', 'safety', 'documents'].map((category) => (
                    <div key={category} className="mb-6">
                      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
                        <span>{getCategoryIcon(category)}</span>
                        <span className="capitalize">{category}</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {checklistItems
                          .map((item, index) => ({ item, index }))
                          .filter(({ item }) => item.category === category)
                          .map(({ item, index }) => (
                            <div key={index} className="rounded-lg border border-gray-200 p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="font-medium text-gray-700">{item.item}</span>
                                <select
                                  value={item.status}
                                  onChange={(e) => handleChecklistChange(index, 'status', e.target.value)}
                                  className={`rounded-lg border px-3 py-1 text-sm font-semibold ${
                                    item.status === 'good'
                                      ? 'border-green-300 bg-green-50 text-green-700'
                                      : item.status === 'needs_attention'
                                      ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
                                      : 'border-red-300 bg-red-50 text-red-700'
                                  }`}
                                >
                                  <option value="good">Good</option>
                                  <option value="needs_attention">Needs Attention</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </div>
                              {(item.status === 'needs_attention' || item.status === 'critical') && (
                                <input
                                  type="text"
                                  value={item.notes || ''}
                                  onChange={(e) => handleChecklistChange(index, 'notes', e.target.value)}
                                  placeholder="Add notes..."
                                  className="w-full rounded border border-gray-300 px-3 py-1 text-sm"
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Issues & Maintenance */}
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Issues & Maintenance</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="issuesReported"
                        checked={issuesReported}
                        onChange={(e) => setIssuesReported(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <label htmlFor="issuesReported" className="font-medium text-gray-700">
                        Issues Reported
                      </label>
                    </div>

                    {issuesReported && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Issue Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2"
                            rows={3}
                            placeholder="Describe the issue..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Urgency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value as any)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="maintenanceRequired"
                        checked={maintenanceRequired}
                        onChange={(e) => setMaintenanceRequired(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <label htmlFor="maintenanceRequired" className="font-medium text-gray-700">
                        Maintenance Required
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2"
                        rows={3}
                        placeholder="Any additional comments..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChecklistItems(defaultChecklistItems);
                      setOdometerReading('');
                      setAdditionalNotes('');
                      setIssuesReported(false);
                      setIssueDescription('');
                    }}
                    className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-lg bg-white p-12 text-center shadow">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">No Reports Found</h2>
                <p className="mt-2 text-gray-600">You haven't submitted any condition reports yet.</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report._id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {report.busId.registrationNumber}
                        </h3>
                        {getStatusBadge(report.status)}
                        <span className="text-sm text-gray-600">
                          {report.shiftType.charAt(0).toUpperCase() + report.shiftType.slice(1)} Shift
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(report.reportDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold capitalize ${getConditionColor(report.overallCondition)}`}>
                        {report.overallCondition}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-600">Odometer</p>
                      <p className="text-lg font-semibold text-gray-900">{report.odometerReading} km</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-600">Fuel Level</p>
                      <p className="text-lg font-semibold text-gray-900">{report.fuelLevel}%</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-600">Checklist Items</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {report.checklistItems?.filter(i => i.status === 'good').length || 0} / {report.checklistItems?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Checklist Summary */}
                  {report.checklistItems && report.checklistItems.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 font-semibold text-gray-900">Inspection Summary:</h4>
                      <div className="grid gap-2 md:grid-cols-2">
                        {report.checklistItems
                          .filter(item => item.status !== 'good')
                          .map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`rounded-lg border p-3 ${
                                item.status === 'needs_attention' 
                                  ? 'border-yellow-300 bg-yellow-50' 
                                  : 'border-red-300 bg-red-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {getCategoryIcon(item.category)} {item.item}
                                </span>
                                <span className={`text-xs font-semibold ${
                                  item.status === 'needs_attention' ? 'text-yellow-700' : 'text-red-700'
                                }`}>
                                  {item.status === 'needs_attention' ? 'Needs Attention' : 'Critical'}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="mt-1 text-sm text-gray-600">{item.notes}</p>
                              )}
                            </div>
                          ))}
                      </div>
                      {report.checklistItems.filter(item => item.status !== 'good').length === 0 && (
                        <p className="text-sm text-green-600">✓ All items in good condition</p>
                      )}
                    </div>
                  )}

                  {report.issuesReported && (
                    <div className="rounded-lg bg-red-50 p-4 mb-4">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">Issue Reported - {report.urgency?.toUpperCase()}</p>
                          <p className="text-sm text-red-800">{report.issueDescription}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {report.additionalNotes && (
                    <div className="rounded-lg bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-900">Additional Notes:</p>
                      <p className="text-sm text-blue-800">{report.additionalNotes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
