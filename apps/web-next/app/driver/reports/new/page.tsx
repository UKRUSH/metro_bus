'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ChecklistItem {
  category: 'exterior' | 'interior' | 'mechanical' | 'safety' | 'documents';
  item: string;
  status: 'good' | 'needs_attention' | 'critical';
  notes?: string;
}

const defaultChecklist: Omit<ChecklistItem, 'status' | 'notes'>[] = [
  // Exterior
  { category: 'exterior', item: 'Body condition (dents, scratches)' },
  { category: 'exterior', item: 'Paint condition' },
  { category: 'exterior', item: 'Mirrors (both sides)' },
  { category: 'exterior', item: 'Windows and windshield' },
  { category: 'exterior', item: 'Headlights and taillights' },
  { category: 'exterior', item: 'Turn signals and indicators' },
  { category: 'exterior', item: 'License plates visible' },
  
  // Interior
  { category: 'interior', item: 'Driver seat condition' },
  { category: 'interior', item: 'Passenger seats condition' },
  { category: 'interior', item: 'Floor cleanliness' },
  { category: 'interior', item: 'Air conditioning working' },
  { category: 'interior', item: 'Dashboard instruments' },
  { category: 'interior', item: 'Emergency exits accessible' },
  
  // Mechanical
  { category: 'mechanical', item: 'Engine performance' },
  { category: 'mechanical', item: 'Brake system' },
  { category: 'mechanical', item: 'Steering response' },
  { category: 'mechanical', item: 'Suspension' },
  { category: 'mechanical', item: 'Transmission/Gearbox' },
  { category: 'mechanical', item: 'Tyres condition and pressure' },
  
  // Safety
  { category: 'safety', item: 'First-aid kit present' },
  { category: 'safety', item: 'Fire extinguisher present' },
  { category: 'safety', item: 'Seat belts functional' },
  { category: 'safety', item: 'Emergency hammer present' },
  { category: 'safety', item: 'Warning triangle present' },
  
  // Documents
  { category: 'documents', item: 'Vehicle registration' },
  { category: 'documents', item: 'Insurance certificate' },
  { category: 'documents', item: 'Route permit' },
];

export default function NewConditionReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buses, setBuses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    busId: '',
    shiftType: 'morning' as 'morning' | 'afternoon' | 'evening' | 'night',
    overallCondition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
    odometerReading: '',
    fuelLevel: '',
    additionalNotes: '',
    issuesReported: false,
    issueDescription: '',
    urgency: 'low' as 'low' | 'medium' | 'high' | 'critical',
    maintenanceRequired: false,
    estimatedRepairTime: '',
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    defaultChecklist.map(item => ({ ...item, status: 'good' as const }))
  );

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'driver')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'driver') {
      fetchBuses();
    }
  }, [user]);

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch('/api/buses', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBuses(data.buses || []);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const handleChecklistChange = (index: number, field: 'status' | 'notes', value: string) => {
    const updated = [...checklistItems];
    if (field === 'status') {
      updated[index].status = value as 'good' | 'needs_attention' | 'critical';
    } else {
      updated[index].notes = value;
    }
    setChecklistItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.busId || !formData.odometerReading || !formData.fuelLevel) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_tokens');
      const tokens = token ? JSON.parse(token) : null;

      const response = await fetch('/api/condition-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          odometerReading: parseInt(formData.odometerReading),
          fuelLevel: parseInt(formData.fuelLevel),
          checklistItems: checklistItems.filter(item => item.status !== 'good' || item.notes),
        }),
      });

      if (response.ok) {
        alert('Condition report submitted successfully!');
        router.push('/driver/reports');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit report');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const groupedChecklist = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bus Condition Report</h1>
          <p className="mt-2 text-gray-600">Daily condition check and inspection</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bus *</label>
                <select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select Bus</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.registrationNumber} - {bus.busType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Type *</label>
                <select
                  value={formData.shiftType}
                  onChange={(e) => setFormData({ ...formData, shiftType: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Condition *</label>
                <select
                  value={formData.overallCondition}
                  onChange={(e) => setFormData({ ...formData, overallCondition: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Odometer Reading (km) *</label>
                <input
                  type="number"
                  value={formData.odometerReading}
                  onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Level (%) *</label>
                <input
                  type="number"
                  value={formData.fuelLevel}
                  onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Inspection Checklist</h2>
            <div className="space-y-6">
              {Object.entries(groupedChecklist).map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-3 text-lg font-medium capitalize text-gray-800">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const globalIndex = checklistItems.findIndex(
                        ci => ci.category === item.category && ci.item === item.item
                      );
                      return (
                        <div key={globalIndex} className="flex items-start gap-3 rounded-lg border p-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{item.item}</p>
                            <input
                              type="text"
                              placeholder="Additional notes (optional)"
                              value={item.notes || ''}
                              onChange={(e) => handleChecklistChange(globalIndex, 'notes', e.target.value)}
                              className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) => handleChecklistChange(globalIndex, 'status', e.target.value)}
                            className={`rounded border px-3 py-1 text-sm font-medium focus:outline-none ${
                              item.status === 'good' ? 'border-green-300 bg-green-50 text-green-700' :
                              item.status === 'needs_attention' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                              'border-red-300 bg-red-50 text-red-700'
                            }`}
                          >
                            <option value="good">Good</option>
                            <option value="needs_attention">Needs Attention</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues & Maintenance */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Issues & Maintenance</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.issuesReported}
                  onChange={(e) => setFormData({ ...formData, issuesReported: e.target.checked })}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Issues Reported</span>
              </label>

              {formData.issuesReported && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
                    <textarea
                      value={formData.issueDescription}
                      onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.maintenanceRequired}
                  onChange={(e) => setFormData({ ...formData, maintenanceRequired: e.target.checked })}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Maintenance Required</span>
              </label>

              {formData.maintenanceRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Repair Time</label>
                  <input
                    type="text"
                    value={formData.estimatedRepairTime}
                    onChange={(e) => setFormData({ ...formData, estimatedRepairTime: e.target.value })}
                    placeholder="e.g., 2 hours, 1 day"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Any additional observations or comments..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
