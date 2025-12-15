'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function NewBusPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'owner' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Get fresh tokens from localStorage
    const storedTokens = localStorage.getItem('auth_tokens');
    if (!storedTokens) {
      alert('Not authenticated. Please login again.');
      router.push('/login');
      return;
    }
    const authTokens = JSON.parse(storedTokens);
    
    const busData: any = {
      registrationNumber: formData.get('registrationNumber'),
      capacity: parseInt(formData.get('capacity') as string),
      busType: formData.get('busType'),
      manufacturer: formData.get('manufacturer') || undefined,
      busModel: formData.get('busModel') || undefined,
      yearOfManufacture: formData.get('yearOfManufacture') ? parseInt(formData.get('yearOfManufacture') as string) : undefined,
      currentStatus: formData.get('currentStatus') || 'available',
      chassisNumber: formData.get('chassisNumber') || undefined,
      engineNumber: formData.get('engineNumber') || undefined,
      routeNumbers: formData.get('routeNumbers') || undefined,
      routePermitNumber: formData.get('routePermitNumber') || undefined,
      permitExpiryDate: formData.get('permitExpiryDate') ? new Date(formData.get('permitExpiryDate') as string).toISOString() : undefined,
      vehicleType: formData.get('vehicleType') || undefined,
      insuranceType: formData.get('insuranceType') || undefined,
      insuranceExpiryDate: formData.get('insuranceExpiryDate') ? new Date(formData.get('insuranceExpiryDate') as string).toISOString() : undefined,
      emissionTestCertificate: formData.get('emissionTestCertificate') || undefined,
      emissionTestExpiry: formData.get('emissionTestExpiry') ? new Date(formData.get('emissionTestExpiry') as string).toISOString() : undefined,
      revenueLicenseNumber: formData.get('revenueLicenseNumber') || undefined,
      revenueLicenseExpiry: formData.get('revenueLicenseExpiry') ? new Date(formData.get('revenueLicenseExpiry') as string).toISOString() : undefined,
      lastMaintenanceDate: formData.get('lastMaintenanceDate') ? new Date(formData.get('lastMaintenanceDate') as string).toISOString() : undefined,
      nextMaintenanceDate: formData.get('nextMaintenanceDate') ? new Date(formData.get('nextMaintenanceDate') as string).toISOString() : undefined,
      tyreConditionFront: formData.get('tyreConditionFront') || undefined,
      tyreConditionRear: formData.get('tyreConditionRear') || undefined,
      brakeTestReport: formData.get('brakeTestReport') || undefined,
      firstAidBoxAvailable: formData.get('firstAidBoxAvailable') === 'on',
      fireExtinguisherAvailable: formData.get('fireExtinguisherAvailable') === 'on',
      cctvAvailable: formData.get('cctvAvailable') === 'on',
      gpsTrackerAvailable: formData.get('gpsTrackerAvailable') === 'on',
    };

    try {
      console.log('Submitting bus data:', busData);
      const response = await fetch('/api/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.accessToken}`,
        },
        body: JSON.stringify(busData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('API Error Response Text:', responseText);
        
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Server error (${response.status}): ${responseText || 'No error message'}`);
        }
        
        console.error('API Error Response:', errorData);
        
        // Format validation errors
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((err: any) => {
            const field = err.path.join('.');
            return `${field}: ${err.message}`;
          }).join('\n');
          throw new Error(errorMessages || 'Validation failed');
        }
        
        throw new Error(errorData.error || errorData.message || 'Failed to create bus');
      }

      const result = await response.json();
      console.log('Success:', result);
      router.push('/buses');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create bus';
      console.error('Form submission error:', errorMessage);
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/buses"
                className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-white">Add New Bus</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border-2 border-red-200 p-6">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Validation Error</h3>
                <pre className="text-red-700 whitespace-pre-wrap font-sans">{error}</pre>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-blue-900">Basic Information</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., NC-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="busType"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="Standard">Standard</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Express">Express</option>
                  <option value="AC">AC</option>
                  <option value="Non-AC">Non-AC</option>
                  <option value="Double Decker">Double Decker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="currentStatus"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="available">Available</option>
                  <option value="in-service">In Service</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-purple-900">Vehicle Details</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Tata Motors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  name="busModel"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Starbus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Manufacture</label>
                <input
                  type="number"
                  name="yearOfManufacture"
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., 2023"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                <select
                  name="vehicleType"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="bus">Bus</option>
                  <option value="metro-bus">Metro Bus</option>
                  <option value="ac">AC Bus</option>
                  <option value="non-ac">Non-AC Bus</option>
                  <option value="semi-luxury">Semi-Luxury Bus</option>
                  <option value="normal">Normal Bus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chassis Number</label>
                <input
                  type="text"
                  name="chassisNumber"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter chassis number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Engine Number</label>
                <input
                  type="text"
                  name="engineNumber"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter engine number"
                />
              </div>
            </div>
          </div>

          {/* Route & Permits */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-orange-900">Route & Permits</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Numbers</label>
                <input
                  type="text"
                  name="routeNumbers"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="e.g., 101, 102"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Route Permit Number</label>
                <input
                  type="text"
                  name="routePermitNumber"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="Enter permit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permit Expiry Date</label>
                <input
                  type="date"
                  name="permitExpiryDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Revenue License Number</label>
                <input
                  type="text"
                  name="revenueLicenseNumber"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Revenue License Expiry</label>
                <input
                  type="date"
                  name="revenueLicenseExpiry"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="rounded-2xl bg-gradient-to-br from-yellow-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-yellow-900">Insurance</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Type</label>
                <select
                  name="insuranceType"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-500 focus:outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="comprehensive">Comprehensive</option>
                  <option value="third-party">Third Party</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Expiry Date</label>
                <input
                  type="date"
                  name="insuranceExpiryDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Emission & Tests */}
          <div className="rounded-2xl bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-red-900">Emission & Tests</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emission Test Certificate</label>
                <input
                  type="text"
                  name="emissionTestCertificate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
                  placeholder="Enter certificate number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emission Test Expiry</label>
                <input
                  type="date"
                  name="emissionTestExpiry"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tyre Condition (Front)</label>
                <select
                  name="tyreConditionFront"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select Condition</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="needs-replacement">Needs Replacement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tyre Condition (Rear)</label>
                <select
                  name="tyreConditionRear"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select Condition</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="needs-replacement">Needs Replacement</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brake Test Report</label>
                <select
                  name="brakeTestReport"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select Status</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="needs-attention">Needs Attention</option>
                </select>
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-indigo-900">Maintenance Schedule</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Maintenance Date</label>
                <input
                  type="date"
                  name="lastMaintenanceDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Scheduled Maintenance</label>
                <input
                  type="date"
                  name="nextMaintenanceDate"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Safety Features */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-teal-900">Safety Features</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="firstAidBoxAvailable"
                  id="firstAidBox"
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="firstAidBox" className="text-sm font-medium text-gray-700">
                  First Aid Box Available
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="fireExtinguisherAvailable"
                  id="fireExtinguisher"
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="fireExtinguisher" className="text-sm font-medium text-gray-700">
                  Fire Extinguisher Available
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="cctvAvailable"
                  id="cctv"
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="cctv" className="text-sm font-medium text-gray-700">
                  CCTV Available
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="gpsTrackerAvailable"
                  id="gpsTracker"
                  className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="gpsTracker" className="text-sm font-medium text-gray-700">
                  GPS Tracker Available
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Bus'}
            </button>
            <Link
              href="/buses"
              className="flex-1 rounded-lg border-2 border-gray-300 py-3 text-center text-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
