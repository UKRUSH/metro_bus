'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface Stop {
  name: string;
  order: number;
  estimatedDuration: number;
}

interface Route {
  _id: string;
  name: string;
  code: string;
  fare: number;
  stops: Stop[];
}

type PassType = 'monthly' | 'quarterly' | 'yearly';

interface PassOption {
  type: PassType;
  name: string;
  duration: string;
  basePrice: number;
  discount: number;
  features: string[];
}

interface PurchaseResult {
  seasonPass: {
    _id: string;
    passType: string;
    startDate: string;
    endDate: string;
    price: number;
    status: string;
  };
}

const passOptions: PassOption[] = [
  {
    type: 'monthly',
    name: 'Monthly Pass',
    duration: '30 Days',
    basePrice: 5000,
    discount: 0,
    features: [
      'Unlimited trips for 30 days',
      'Valid on all routes',
      'No booking required',
      'Auto-renew option',
      'Digital QR code',
    ],
  },
  {
    type: 'quarterly',
    name: 'Quarterly Pass',
    duration: '90 Days',
    basePrice: 13500,
    discount: 10,
    features: [
      'Unlimited trips for 90 days',
      'Valid on all routes',
      'No booking required',
      'Auto-renew option',
      'Digital QR code',
      'Save 10% vs monthly',
    ],
  },
  {
    type: 'yearly',
    name: 'Yearly Pass',
    duration: '365 Days',
    basePrice: 48000,
    discount: 20,
    features: [
      'Unlimited trips for 365 days',
      'Valid on all routes',
      'No booking required',
      'Auto-renew option',
      'Digital QR code',
      'Save 20% vs monthly',
      'Best value!',
    ],
  },
];

export default function PurchaseSeasonPassPage() {
  const router = useRouter();
  const { tokens, isAuthenticated, user } = useAuth();
  
  // Form State
  const [selectedType, setSelectedType] = useState<PassType>('monthly');
  const [routeSpecific, setRouteSpecific] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [boardingStop, setBoardingStop] = useState('');
  const [alightingStop, setAlightingStop] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [autoRenew, setAutoRenew] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (routeSpecific) {
      fetchRoutes();
    }
  }, [routeSpecific]);

  useEffect(() => {
    setBoardingStop('');
    setAlightingStop('');
  }, [selectedRoute]);

  const fetchRoutes = async () => {
    if (!tokens?.accessToken) return;

    try {
      const response = await fetch('/api/routes', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data?.routes || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const getSelectedRouteDetails = (): Route | undefined => {
    return routes.find((r) => r._id === selectedRoute);
  };

  const calculateRouteFare = (): number => {
    if (!routeSpecific || !selectedRoute) return 0;

    const route = getSelectedRouteDetails();
    if (!route) return 0;

    if (boardingStop && alightingStop && route.stops) {
      const boardingIndex = route.stops.findIndex((s) => s.name === boardingStop);
      const alightingIndex = route.stops.findIndex((s) => s.name === alightingStop);

      if (boardingIndex !== -1 && alightingIndex !== -1) {
        const distance = Math.abs(alightingIndex - boardingIndex);
        const baseFare = route.fare || 100;
        const distanceFare = Math.round(baseFare * (distance * 0.15));
        return Math.max(baseFare * 0.5, distanceFare);
      }
    }

    return route.fare || 0;
  };

  const getPrice = () => {
    const option = passOptions.find((opt) => opt.type === selectedType);
    if (!option) return 0;

    if (routeSpecific) {
      const routeFare = calculateRouteFare();
      return routeFare > 0 ? Math.round(routeFare * 30) : Math.round(option.basePrice * 0.3);
    }

    return option.basePrice;
  };

  const generateQRCode = async (passId: string) => {
    setLoadingQr(true);
    try {
      const response = await fetch(`/api/season-passes/${passId}/generate-qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();
      setQrCode(data.data.qrCode);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. You can view it later from your season passes.');
    } finally {
      setLoadingQr(false);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError('');

      if (routeSpecific && !selectedRoute) {
        setError('Please select a route');
        return;
      }

      if (routeSpecific && (!boardingStop || !alightingStop)) {
        setError('Please select boarding and alighting stops');
        return;
      }

      const response = await fetch('/api/season-passes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          passType: selectedType,
          routeId: routeSpecific ? selectedRoute : undefined,
          boardingStop: routeSpecific ? boardingStop : undefined,
          alightingStop: routeSpecific ? alightingStop : undefined,
          paymentMethod: paymentMethod,
          autoRenew: autoRenew,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to purchase season pass');
      }

      const data = await response.json();
      setPurchaseResult(data.data);
      setPurchaseComplete(true);

      // Generate QR code for the purchased pass
      await generateQRCode(data.data.seasonPass._id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `season-pass-${purchaseResult?.seasonPass._id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Purchase Complete Screen
  if (purchaseComplete && purchaseResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Purchase Successful!</h1>
                  <p className="text-sm text-gray-600">Your season pass is ready to use</p>
                </div>
              </div>
              <Link href="/season-passes">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  View All Passes
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            {/* QR Code Section */}
            <div className="mb-8 text-center">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Season Pass QR Code</h2>
              
              {loadingQr ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600">Generating your QR code...</p>
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl border-4 border-blue-600 bg-white p-6 shadow-lg">
                    <Image 
                      src={qrCode} 
                      alt="Season Pass QR Code" 
                      width={300} 
                      height={300}
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download QR Code
                    </button>
                    
                    <p className="text-sm text-gray-600">
                      Save this QR code on your phone for easy access
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
                  <p>QR code could not be generated. You can generate it later from your season passes page.</p>
                </div>
              )}
            </div>

            {/* Pass Details */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Pass Details</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">Pass ID</p>
                  <p className="font-mono text-lg font-semibold text-blue-900">
                    {purchaseResult.seasonPass._id.slice(-8).toUpperCase()}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">Status</p>
                  <p className="text-lg font-semibold capitalize text-green-900">
                    {purchaseResult.seasonPass.status}
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm text-purple-700">Pass Type</p>
                  <p className="text-lg font-semibold capitalize text-purple-900">
                    {purchaseResult.seasonPass.passType}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-orange-700">Price Paid</p>
                  <p className="text-lg font-semibold text-orange-900">
                    LKR {purchaseResult.seasonPass.price.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg bg-indigo-50 p-4">
                  <p className="text-sm text-indigo-700">Valid From</p>
                  <p className="text-lg font-semibold text-indigo-900">
                    {formatDate(purchaseResult.seasonPass.startDate)}
                  </p>
                </div>

                <div className="rounded-lg bg-pink-50 p-4">
                  <p className="text-sm text-pink-700">Valid Until</p>
                  <p className="text-lg font-semibold text-pink-900">
                    {formatDate(purchaseResult.seasonPass.endDate)}
                  </p>
                </div>
              </div>

              {selectedRoute && routeSpecific && (
                <div className="mt-6 rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Route Information</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-medium text-gray-900">
                        {getSelectedRouteDetails()?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From:</span>
                      <span className="font-medium text-gray-900">{boardingStop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-medium text-gray-900">{alightingStop}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 rounded-lg bg-blue-50 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-blue-900">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Use Your Season Pass
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Show this QR code to the bus driver or conductor when boarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>The driver will scan your QR code to validate your pass</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>No need to book tickets - just board and show your pass</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Make sure your pass is active and within the validity period</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/season-passes" className="flex-1">
                <button className="w-full rounded-lg border-2 border-blue-600 bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50">
                  View All My Passes
                </button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <button className="w-full rounded-lg bg-gray-100 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-200">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Purchase Form Screen
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="rounded-lg p-2 hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Purchase Season Pass</h1>
              <p className="text-sm text-gray-600">Choose your plan and save on travel</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Pass Type Selection */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Select Pass Type</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {passOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={`rounded-xl p-6 text-left transition-all ${
                  selectedType === option.type
                    ? 'border-2 border-blue-600 bg-blue-50 shadow-lg'
                    : 'border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {option.discount > 0 && (
                  <div className="mb-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    SAVE {option.discount}%
                  </div>
                )}
                <h3 className="mb-2 text-xl font-bold text-gray-900">{option.name}</h3>
                <p className="mb-4 text-sm text-gray-600">{option.duration}</p>
                <p className="mb-4 text-3xl font-bold text-blue-600">
                  LKR {option.basePrice.toLocaleString()}
                </p>
                <ul className="space-y-2">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="h-5 w-5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Route Selection */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Pass Coverage</h2>
          
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="coverage"
                checked={!routeSpecific}
                onChange={() => setRouteSpecific(false)}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Unlimited Routes</p>
                <p className="text-sm text-gray-600">Valid on all routes across the network</p>
              </div>
            </label>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="coverage"
                checked={routeSpecific}
                onChange={() => setRouteSpecific(true)}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Single Route</p>
                <p className="text-sm text-gray-600">70% off - Valid only on selected route</p>
              </div>
            </label>

            {routeSpecific && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Select Route
                  </label>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Choose a route</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.name} ({route.code})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedRoute && getSelectedRouteDetails()?.stops && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Boarding Stop <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={boardingStop}
                        onChange={(e) => setBoardingStop(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select boarding stop</option>
                        {getSelectedRouteDetails()?.stops.map((stop) => (
                          <option key={stop.name} value={stop.name}>
                            {stop.order}. {stop.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Alighting Stop <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={alightingStop}
                        onChange={(e) => setAlightingStop(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={!boardingStop}
                      >
                        <option value="">Select alighting stop</option>
                        {getSelectedRouteDetails()?.stops
                          .filter((stop) => stop.name !== boardingStop)
                          .map((stop) => (
                            <option key={stop.name} value={stop.name}>
                              {stop.order}. {stop.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                {boardingStop && alightingStop && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-semibold text-blue-900">Journey Details</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">From:</span>
                        <span className="font-medium text-blue-900">{boardingStop}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">To:</span>
                        <span className="font-medium text-blue-900">{alightingStop}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-2">
                        <span className="text-blue-700">Single Journey Fare:</span>
                        <span className="font-bold text-blue-900">LKR {calculateRouteFare()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Monthly Pass (30 trips):</span>
                        <span className="font-bold text-green-600">LKR {Math.round(calculateRouteFare() * 30)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment and Summary */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Payment Options</h2>
              
              <div className="mb-6 space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900">Credit/Debit Card</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="mobile"
                    checked={paymentMethod === 'mobile'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900">Mobile Payment</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium text-gray-900">Bank Transfer</span>
                </label>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Enable Auto-Renewal</p>
                    <p className="text-sm text-gray-600">
                      Automatically renew this pass when it expires
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Order Summary</h2>
              
              <div className="space-y-3 border-b border-gray-200 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pass Type</span>
                  <span className="font-semibold text-gray-900">
                    {passOptions.find((opt) => opt.type === selectedType)?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coverage</span>
                  <span className="font-semibold text-gray-900">
                    {routeSpecific ? 'Single Route' : 'All Routes'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {passOptions.find((opt) => opt.type === selectedType)?.duration}
                  </span>
                </div>
                {autoRenew && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Auto-Renew</span>
                    <span className="font-semibold text-green-600">Enabled</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  LKR {getPrice().toLocaleString()}
                </span>
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={
                  loading ||
                  (routeSpecific && (!selectedRoute || !boardingStop || !alightingStop))
                }
                className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Purchase Season Pass'}
              </button>

              <p className="mt-4 text-center text-xs text-gray-600">
                You will receive a QR code immediately after purchase
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
