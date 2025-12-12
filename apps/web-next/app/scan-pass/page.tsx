'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ValidationResult {
  success: boolean;
  valid: boolean;
  validations: {
    exists: boolean;
    isActive: boolean;
    notExpired: boolean;
    paymentCompleted: boolean;
    userMatches: boolean;
  };
  data?: {
    pass: {
      id: string;
      passType: string;
      status: string;
      startDate: string;
      endDate: string;
      usageCount: number;
      paymentStatus: string;
    };
    passenger: {
      name: string;
      email: string;
    };
    route: {
      name: string;
      code: string;
    } | null;
    boardingStop?: string;
    alightingStop?: string;
  };
  message: string;
  issues?: string[];
}

export default function ScanQRPage() {
  const { tokens, user } = useAuth();
  const [qrInput, setQrInput] = useState('');
  const [location, setLocation] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (!qrInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      // Parse QR data if it's JSON string
      let qrDataToSend = qrInput;
      try {
        const parsed = JSON.parse(qrInput);
        qrDataToSend = JSON.stringify(parsed); // Ensure it's properly formatted
      } catch {
        // If not JSON, send as is
      }

      const response = await fetch('/api/season-passes/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          qrData: qrDataToSend,
          location: location || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.valid) {
        // Clear input on successful scan after showing result
        setTimeout(() => {
          setQrInput('');
          setLocation('');
        }, 5000); // Increased to 5 seconds to see the update
      }
    } catch (err) {
      setError('Failed to scan QR code. Please try again.');
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPassTypeDisplay = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Scan Season Pass</h1>
                <p className="text-sm text-gray-600">Validate passenger QR codes</p>
              </div>
            </div>
            <Link href="/dashboard">
              <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Scanner Input */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Enter QR Code Data</h2>
            <p className="text-sm text-gray-600">Paste the QR code content or scan using a QR scanner</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                QR Code Data <span className="text-red-500">*</span>
              </label>
              <textarea
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder='Paste QR code JSON data here, e.g., {"passId":"693be983aa18003e4653399a","passType":"monthly",...}'
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={6}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Colombo Fort Bus Stand"
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={scanning || !qrInput.trim()}
              className="w-full rounded-lg bg-blue-600 px-6 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {scanning ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Validating...</span>
                </div>
              ) : (
                'Validate Pass'
              )}
            </button>
          </div>
        </div>

        {/* Validation Result */}
        {result && (
          <div className={`rounded-2xl p-8 shadow-xl ${result.valid ? 'bg-green-50 border-4 border-green-500' : 'bg-red-50 border-4 border-red-500'}`}>
            {/* Status Header */}
            <div className="mb-6 flex items-center justify-center gap-4">
              {result.valid ? (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-green-900">VALID PASS</h2>
                    <p className="text-lg text-green-700">Passenger can board</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500">
                    <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-red-900">INVALID PASS</h2>
                    <p className="text-lg text-red-700">Deny boarding</p>
                  </div>
                </>
              )}
            </div>

            {/* Pass Details */}
            {result.data && (
              <div className="space-y-6">
                {/* Usage Statistics - PROMINENT */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 shadow-lg">
                  <div className="text-center">
                    <p className="mb-2 text-lg font-semibold text-blue-100">USAGE STATISTICS</p>
                    <div className="mb-2">
                      <span className="text-7xl font-black text-white">{result.data.pass.usageCount}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">TOTAL TRIPS USED</p>
                    <p className="mt-3 text-lg text-blue-100">
                      {result.data.pass.passType.toUpperCase()} PASS
                    </p>
                    {result.valid && (
                      <div className="mt-4 rounded-lg bg-white/20 p-3">
                        <p className="text-xl font-bold text-yellow-200">✓ TRIP COUNTED</p>
                        <p className="text-sm text-white">This scan has been recorded</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passenger Information */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    PASSENGER DETAILS
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 p-5">
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-600">Full Name</p>
                      <p className="text-4xl font-black text-gray-900">{result.data.passenger.name || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-5">
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-purple-600">Email Address</p>
                      <p className="text-2xl font-bold text-gray-700 break-all">{result.data.passenger.email}</p>
                    </div>
                  </div>
                </div>

                {/* Pass Information */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    PASS INFORMATION
                  </h3>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-purple-50 p-5">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-purple-600">Pass Type</p>
                        <p className="text-4xl font-black text-purple-900">{getPassTypeDisplay(result.data.pass.passType)}</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-5">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-green-600">Status</p>
                        <p className={`text-4xl font-black uppercase ${result.data.pass.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.data.pass.status}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-5">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-blue-600">Valid From</p>
                        <p className="text-2xl font-black text-gray-900">{formatDate(result.data.pass.startDate)}</p>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-5">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-orange-600">Valid Until</p>
                        <p className="text-2xl font-black text-gray-900">{formatDate(result.data.pass.endDate)}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-6">
                      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-indigo-600">Payment Status</p>
                      <p className={`text-3xl font-black uppercase ${result.data.pass.paymentStatus === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                        {result.data.pass.paymentStatus}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Information */}
                {result.data.route && (
                  <div className="rounded-xl bg-white p-6 shadow-md">
                    <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                      <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      ROUTE DETAILS
                    </h3>
                    <div className="space-y-4">
                      <div className="rounded-lg bg-orange-50 p-6">
                        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-orange-600">Route Name</p>
                        <p className="text-4xl font-black text-gray-900">{result.data.route.name}</p>
                        <p className="mt-3 text-2xl font-bold text-orange-600">Code: {result.data.route.code}</p>
                      </div>
                      {result.data.boardingStop && result.data.alightingStop && (
                        <div className="rounded-lg bg-teal-50 p-6">
                          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-teal-600">Journey Route</p>
                          <div className="space-y-3">
                            <div className="rounded-lg bg-white p-4">
                              <p className="text-sm font-semibold text-teal-600">FROM</p>
                              <p className="text-3xl font-black text-gray-900">
                                {result.data.boardingStop.toUpperCase()}
                              </p>
                            </div>
                            <div className="flex items-center justify-center">
                              <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            </div>
                            <div className="rounded-lg bg-white p-4">
                              <p className="text-sm font-semibold text-teal-600">TO</p>
                              <p className="text-3xl font-black text-gray-900">
                                {result.data.alightingStop.toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Validation Checks */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Validation Checks</h3>
                  <div className="space-y-2">
                    {Object.entries(result.validations).map(([key, passed]) => (
                      <div key={key} className="flex items-center gap-3">
                        {passed ? (
                          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className={`text-lg font-semibold ${passed ? 'text-green-700' : 'text-red-700'}`}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {result.issues && result.issues.length > 0 && (
                  <div className="rounded-xl bg-red-100 p-6 shadow-md">
                    <h3 className="mb-3 text-xl font-bold text-red-900">Issues Found</h3>
                    <ul className="list-inside list-disc space-y-2 text-red-800">
                      {result.issues.map((issue, index) => (
                        <li key={index} className="text-lg font-semibold">
                          {issue.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  setResult(null);
                  setQrInput('');
                }}
                className="w-full rounded-lg bg-gray-800 px-6 py-3 font-bold text-white hover:bg-gray-900"
              >
                Scan Another Pass
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
