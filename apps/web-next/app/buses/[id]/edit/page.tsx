'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  yearOfManufacture?: number;
  currentStatus: 'available' | 'in-service' | 'maintenance' | 'retired';
  chassisNumber?: string;
  engineNumber?: string;
  routeNumbers?: string;
  routePermitNumber?: string;
  permitExpiryDate?: string;
  vehicleType?: string;
  insuranceType?: string;
  insuranceExpiryDate?: string;
  emissionTestCertificate?: string;
  emissionTestExpiry?: string;
  revenueLicenseNumber?: string;
  revenueLicenseExpiry?: string;
  tyreConditionFront?: string;
  tyreConditionRear?: string;
  brakeTestReport?: string;
  firstAidBoxAvailable?: boolean;
  fireExtinguisherAvailable?: boolean;
  cctvAvailable?: boolean;
  gpsTrackerAvailable?: boolean;
  status?: string;
}

export default function EditBusPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { tokens, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busId, setBusId] = useState<string | null>(null);

  // Extract id from params
  useEffect(() => {
    if (params?.id) {
      setBusId(params.id as string);
    }
  }, [params]);

  useEffect(() => {
    if (authLoading || !busId) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'owner' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    fetchBus();
  }, [authLoading, isAuthenticated, user, busId]);

  const fetchBus = async () => {
    if (!busId) return;
    
    try {
      const response = await fetch(`/api/buses/${busId}`, {
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bus');
      }

      const data = await response.json();
      console.log('Fetched bus data for edit:', data.data.bus);
      setBus(data.data.bus);
    } catch (err) {
      setError('Failed to load bus details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      currentStatus: formData.get('currentStatus'),
      chassisNumber: formData.get('chassisNumber') || undefined,
      engineNumber: formData.get('engineNumber') || undefined,
      routeNumbers: formData.get('routeNumbers') || undefined,
      routePermitNumber: formData.get('routePermitNumber') || undefined,
      permitExpiryDate: formData.get('permitExpiryDate') || undefined,
      vehicleType: formData.get('vehicleType') || undefined,
      insuranceType: formData.get('insuranceType') || undefined,
      insuranceExpiryDate: formData.get('insuranceExpiryDate') || undefined,
      emissionTestCertificate: formData.get('emissionTestCertificate') || undefined,
      emissionTestExpiry: formData.get('emissionTestExpiry') || undefined,
      revenueLicenseNumber: formData.get('revenueLicenseNumber') || undefined,
      revenueLicenseExpiry: formData.get('revenueLicenseExpiry') || undefined,
      tyreConditionFront: formData.get('tyreConditionFront') || undefined,
      tyreConditionRear: formData.get('tyreConditionRear') || undefined,
      brakeTestReport: formData.get('brakeTestReport') || undefined,
      firstAidBoxAvailable: formData.get('firstAidBoxAvailable') === 'on',
      fireExtinguisherAvailable: formData.get('fireExtinguisherAvailable') === 'on',
      cctvAvailable: formData.get('cctvAvailable') === 'on',
      gpsTrackerAvailable: formData.get('gpsTrackerAvailable') === 'on',
    };

    try {
      // Get fresh tokens from localStorage
      const authTokens = JSON.parse(localStorage.getItem('auth_tokens') || '{}');
      
      const response = await fetch(`/api/buses/${busId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authTokens.accessToken}`,
        },
        body: JSON.stringify(busData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bus');
      }

      router.push('/buses');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update bus');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !bus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Bus not found'}</p>
          <Link href="/buses" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to Buses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/buses">
                <button className="rounded-lg p-2 hover:bg-blue-50 transition-colors">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Bus</h1>
                <p className="text-sm text-gray-600">{bus.registrationNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-blue-200">
                <span className="bg-blue-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Basic Information
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    defaultValue={bus.registrationNumber}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    required
                    min="1"
                    defaultValue={bus.capacity}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bus Type *</label>
                  <select
                    name="busType"
                    required
                    defaultValue={bus.busType}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Express">Express</option>
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Double Decker">Double Decker</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                  <select
                    name="currentStatus"
                    required
                    defaultValue={bus.status || bus.currentStatus}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="available">Available</option>
                    <option value="in-service">In Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    defaultValue={bus.manufacturer || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                    placeholder="e.g., Tata, Ashok Leyland"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    name="busModel"
                    defaultValue={bus.busModel || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                    placeholder="e.g., Starbus, Ultra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Manufacture</label>
                  <input
                    type="number"
                    name="yearOfManufacture"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    defaultValue={bus.yearOfManufacture || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    defaultValue={bus.vehicleType || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="">Select Type</option>
                    <option value="ac">AC</option>
                    <option value="non-ac">Non-AC</option>
                    <option value="semi-luxury">Semi-Luxury</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border-2 border-purple-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-purple-200">
                <span className="bg-purple-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                Vehicle Details
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chassis Number</label>
                  <input
                    type="text"
                    name="chassisNumber"
                    defaultValue={bus.chassisNumber || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Engine Number</label>
                  <input
                    type="text"
                    name="engineNumber"
                    defaultValue={bus.engineNumber || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Route & Permits */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-orange-200">
                <span className="bg-orange-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </span>
                Route & Permits
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route Numbers</label>
                  <input
                    type="text"
                    name="routeNumbers"
                    defaultValue={bus.routeNumbers || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Route Permit Number</label>
                  <input
                    type="text"
                    name="routePermitNumber"
                    defaultValue={bus.routePermitNumber || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Permit Expiry Date</label>
                  <input
                    type="date"
                    name="permitExpiryDate"
                    defaultValue={bus.permitExpiryDate ? new Date(bus.permitExpiryDate).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-6 border-2 border-yellow-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-yellow-200">
                <span className="bg-yellow-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                Insurance
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Type</label>
                  <select
                    name="insuranceType"
                    defaultValue={bus.insuranceType || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="">Select Type</option>
                    <option value="comprehensive">Comprehensive</option>
                    <option value="third-party">Third Party</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Expiry Date</label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    defaultValue={bus.insuranceExpiryDate ? new Date(bus.insuranceExpiryDate).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Emission & Tests */}
            <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 border-2 border-red-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-red-200">
                <span className="bg-red-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Emission & Tests
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Emission Test Certificate</label>
                  <input
                    type="text"
                    name="emissionTestCertificate"
                    defaultValue={bus.emissionTestCertificate || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Emission Test Expiry</label>
                  <input
                    type="date"
                    name="emissionTestExpiry"
                    defaultValue={bus.emissionTestExpiry ? new Date(bus.emissionTestExpiry).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenue License Number</label>
                  <input
                    type="text"
                    name="revenueLicenseNumber"
                    defaultValue={bus.revenueLicenseNumber || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Revenue License Expiry</label>
                  <input
                    type="date"
                    name="revenueLicenseExpiry"
                    defaultValue={bus.revenueLicenseExpiry ? new Date(bus.revenueLicenseExpiry).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-indigo-200">
                <span className="bg-indigo-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
                Maintenance Schedule
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Maintenance Date</label>
                  <input
                    type="date"
                    name="lastMaintenanceDate"
                    defaultValue={bus.lastMaintenanceDate ? new Date(bus.lastMaintenanceDate).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Next Maintenance Date</label>
                  <input
                    type="date"
                    name="nextMaintenanceDate"
                    defaultValue={bus.nextMaintenanceDate ? new Date(bus.nextMaintenanceDate).toISOString().split('T')[0] : ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all text-gray-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Bus Condition */}
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-6 border-2 border-teal-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-teal-200">
                <span className="bg-teal-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Bus Condition
              </h3>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Front Tyre Condition</label>
                  <select
                    name="tyreConditionFront"
                    defaultValue={bus.tyreConditionFront || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="">Select</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rear Tyre Condition</label>
                  <select
                    name="tyreConditionRear"
                    defaultValue={bus.tyreConditionRear || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="">Select</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Brake Test Report</label>
                  <select
                    name="brakeTestReport"
                    defaultValue={bus.brakeTestReport || ''}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="">Select</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Safety Features */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-6 border-2 border-green-100 shadow-sm hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3 pb-3 border-b border-green-200">
                <span className="bg-green-500 text-white rounded-xl p-2.5 shadow-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                Safety Features
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="firstAidBoxAvailable"
                    id="firstAidBoxAvailable"
                    defaultChecked={bus.firstAidBoxAvailable}
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="firstAidBoxAvailable" className="text-sm font-medium text-gray-700">
                    First Aid Box Available
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="fireExtinguisherAvailable"
                    id="fireExtinguisherAvailable"
                    defaultChecked={bus.fireExtinguisherAvailable}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="fireExtinguisherAvailable" className="text-sm font-medium text-gray-700">
                    Fire Extinguisher Available
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="cctvAvailable"
                    id="cctvAvailable"
                    defaultChecked={bus.cctvAvailable}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cctvAvailable" className="text-sm font-medium text-gray-700">
                    CCTV Available
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="gpsTrackerAvailable"
                    id="gpsTrackerAvailable"
                    defaultChecked={bus.gpsTrackerAvailable}
                    className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="gpsTrackerAvailable" className="text-sm font-medium text-gray-700">
                    GPS Tracker Available
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
              <Link 
                href="/buses"
                className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3.5 font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all shadow-md hover:shadow-lg text-center"
              >
                ✕ Cancel
              </Link>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 font-bold text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                ✓ Update Bus
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
