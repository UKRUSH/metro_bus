'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';

interface Stop {
  name: string;
  order: number;
}

interface Route {
  _id: string;
  name: string;
  code: string;
  fare: number;
  stops: Stop[];
}

interface SeasonPass {
  _id: string;
  userId?: string;
  passType: 'monthly' | 'quarterly' | 'yearly';
  routeId?: Route;
  boardingStop?: string;
  alightingStop?: string;
  startDate: string;
  endDate: string;
  price: number;
  status: 'active' | 'expired' | 'suspended';
  usageCount: number;
  maxUsage?: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  autoRenew: boolean;
  createdAt: string;
}

export default function SeasonPassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens, isAuthenticated } = useAuth();
  const passId = params.id as string;
  const showSuccess = searchParams.get('success') === 'true';

  const [pass, setPass] = useState<SeasonPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchPass();
  }, [passId, isAuthenticated, router]);

  useEffect(() => {
    if (pass) {
      generateQRCode();
    }
  }, [pass]);

  const generateQRCode = async () => {
    if (!pass) return;

    try {
      // Create QR code data with all relevant information
      const qrData = {
        passId: pass._id,
        passType: pass.passType,
        userId: pass.userId || '',
        routeId: pass.routeId?._id || 'all',
        routeName: pass.routeId?.name || 'All Routes',
        routeCode: pass.routeId?.code || 'ALL',
        boardingStop: pass.boardingStop || 'any',
        alightingStop: pass.alightingStop || 'any',
        startDate: pass.startDate,
        endDate: pass.endDate,
        status: pass.status,
        usageCount: pass.usageCount,
        price: pass.price,
        validUntil: pass.endDate,
      };

      // Generate QR code as data URL
      const url = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      });

      setQrCodeUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `season-pass-${pass?._id}.png`;
    link.click();
  };

  const fetchPass = async () => {
    if (!tokens?.accessToken) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/season-passes/${passId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch season pass');
      }

      const data = await response.json();
      setPass(data.data.seasonPass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!pass) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/season-passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          autoRenew: !pass.autoRenew,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pass');
      }

      await fetchPass();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleSuspend = async () => {
    if (!pass) return;

    const confirmed = confirm('Are you sure you want to suspend this pass?');
    if (!confirmed) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/season-passes/${passId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          action: 'suspend',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend pass');
      }

      await fetchPass();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suspend failed');
    } finally {
      setUpdating(false);
    }
  };

  const getPassTypeName = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'Monthly Pass';
      case 'quarterly':
        return 'Quarterly Pass';
      case 'yearly':
        return 'Yearly Pass';
      default:
        return type;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!pass) return 0;
    const end = new Date(pass.endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isActive = pass && pass.status === 'active' && getDaysRemaining() > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <p className="text-xl font-semibold text-red-700">Error</p>
          <p className="mt-2 text-red-600">{error || 'Pass not found'}</p>
          <Link
            href="/season-passes"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Passes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/season-passes">
              <button className="rounded-lg p-2 hover:bg-gray-100">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Season Pass Details</h1>
              <p className="text-sm text-gray-600">ID: {pass._id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Success Alert */}
        {showSuccess && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-700">
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">Season pass purchased successfully!</p>
            </div>
          </div>
        )}

        {/* Pass Card */}
        <div className="mb-6 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold">{getPassTypeName(pass.passType)}</h2>
              <p className="mt-2 text-blue-100">
                {pass.routeId ? `${pass.routeId.name} (${pass.routeId.code})` : 'All Routes - Unlimited'}
              </p>
            </div>
            <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
              {pass.status.toUpperCase()}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-blue-100">Valid From</p>
              <p className="text-lg font-bold">{formatDate(pass.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-100">Valid Until</p>
              <p className="text-lg font-bold">{formatDate(pass.endDate)}</p>
            </div>
            {isActive && (
              <div>
                <p className="text-sm text-blue-100">Days Remaining</p>
                <p className="text-3xl font-bold">{getDaysRemaining()}</p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-lg bg-white p-4 shadow-lg">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Season Pass QR Code" className="h-64 w-64" />
              ) : (
                <div className="h-64 w-64 bg-gray-200 flex items-center justify-center animate-pulse">
                  <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-white">Scan this QR code on the bus to validate</p>
            {qrCodeUrl && (
              <button
                onClick={downloadQRCode}
                className="mt-3 flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download QR Code
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Usage Stats */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Usage Statistics</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{pass.usageCount}</p>
              </div>
              {pass.maxUsage && (
                <div>
                  <p className="text-sm text-gray-600">Remaining Trips</p>
                  <p className="text-2xl font-bold text-blue-600">{pass.maxUsage - pass.usageCount}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Payment Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Amount Paid</p>
                <p className="text-2xl font-bold text-blue-600">LKR {pass.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-semibold text-gray-900 capitalize">{pass.paymentStatus}</p>
              </div>
              {pass.paymentMethod && (
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{pass.paymentMethod}</p>
                </div>
              )}
              {pass.transactionId && (
                <div>
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-900">{pass.transactionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Route Details */}
          {pass.routeId && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Route Details</h3>
              
              {/* Boarding and Alighting Stops */}
              {(pass.boardingStop || pass.alightingStop) && (
                <div className="mb-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Your Journey</p>
                  <div className="space-y-2">
                    {pass.boardingStop && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Boarding at</p>
                          <p className="font-semibold text-gray-900">{pass.boardingStop}</p>
                        </div>
                      </div>
                    )}
                    {pass.alightingStop && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Alighting at</p>
                          <p className="font-semibold text-gray-900">{pass.alightingStop}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Stops */}
              <p className="text-sm text-gray-600 mb-3">All stops on this route:</p>
              <div className="space-y-3">
                {pass.routeId.stops?.map((stop, index) => {
                  const isBoarding = stop.name === pass.boardingStop;
                  const isAlighting = stop.name === pass.alightingStop;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 ${
                        isBoarding || isAlighting ? 'bg-blue-50 p-2 rounded-lg border border-blue-200' : ''
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isBoarding ? 'bg-green-100 text-green-600' :
                        isAlighting ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      } text-sm font-bold`}>
                        {stop.order}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{stop.name}</span>
                        {isBoarding && <span className="ml-2 text-xs text-green-600 font-semibold">(Boarding)</span>}
                        {isAlighting && <span className="ml-2 text-xs text-red-600 font-semibold">(Alighting)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Auto-Renew</p>
                  <p className="text-sm text-gray-600">Automatically renew when pass expires</p>
                </div>
                <button
                  onClick={handleToggleAutoRenew}
                  disabled={updating || pass.status === 'expired'}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    pass.autoRenew ? 'bg-blue-600' : 'bg-gray-200'
                  } ${updating || pass.status === 'expired' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      pass.autoRenew ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isActive && (
                <button
                  onClick={handleSuspend}
                  disabled={updating}
                  className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {updating ? 'Suspending...' : 'Suspend Pass'}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
          )}
        </div>
      </main>
    </div>
  );
}
