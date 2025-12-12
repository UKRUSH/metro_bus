'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface SearchFilters {
  origin: string;
  destination: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  busType: string;
  timeOfDay: string;
  minSeats: string;
  sortBy: string;
}

interface SearchResult {
  scheduleId: string;
  route: {
    _id: string;
    name: string;
    code: string;
    origin: string;
    destination: string;
    fare: number;
    distance: number;
    estimatedDuration: number;
  };
  bus: {
    _id: string;
    registrationNumber: string;
    busType: string;
    capacity: number;
    facilities: string[];
  };
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number;
  occupancyRate: string;
}

export default function EnhancedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tokens } = useAuth();
  
  const [filters, setFilters] = useState<SearchFilters>({
    origin: searchParams?.get('origin') || '',
    destination: searchParams?.get('destination') || '',
    date: searchParams?.get('date') || new Date().toISOString().split('T')[0],
    minPrice: '',
    maxPrice: '',
    busType: '',
    timeOfDay: '',
    minSeats: '',
    sortBy: 'departureTime',
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (filters.origin && filters.destination) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/search/trips?${params.toString()}`, {
        headers: tokens?.accessToken ? {
          'Authorization': `Bearer ${tokens.accessToken}`,
        } : {},
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      
      if (data.results.length === 0) {
        setError('No trips found matching your search criteria');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      date: new Date().toISOString().split('T')[0],
      minPrice: '',
      maxPrice: '',
      busType: '',
      timeOfDay: '',
      minSeats: '',
      sortBy: 'departureTime',
    });
    setResults([]);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Metro Bus</h1>
            </Link>
            <div className="flex gap-3">
              <Link href="/bookings" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all">
                My Bookings
              </Link>
              <Link href="/season-passes" className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all">
                Season Passes
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Trip
          </h2>
          <p className="text-lg text-gray-600">
            Search and book bus tickets with advanced filters
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <input
                  name="origin"
                  type="text"
                  value={filters.origin}
                  onChange={handleFilterChange}
                  className="block w-full rounded-lg border-2 border-gray-200 pl-10 pr-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Origin city"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <input
                  name="destination"
                  type="text"
                  value={filters.destination}
                  onChange={handleFilterChange}
                  className="block w-full rounded-lg border-2 border-gray-200 pl-10 pr-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Destination city"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                name="date"
                type="date"
                value={filters.date}
                onChange={handleFilterChange}
                className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-white font-semibold hover:shadow-lg transition-all"
              >
                🔍 Search
              </button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
            >
              {showFilters ? '▲' : '▼'} Advanced Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid gap-4 md:grid-cols-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (Rs.)</label>
                  <input
                    name="minPrice"
                    type="number"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (Rs.)</label>
                  <input
                    name="maxPrice"
                    type="number"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="1000"
                  />
                </div>

                {/* Bus Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                  <select
                    name="busType"
                    value={filters.busType}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="Standard">Standard</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Express">Express</option>
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                  </select>
                </div>

                {/* Time of Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                  <select
                    name="timeOfDay"
                    value={filters.timeOfDay}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Any Time</option>
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                    <option value="night">Night (9 PM - 6 AM)</option>
                  </select>
                </div>

                {/* Min Seats */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Available Seats</label>
                  <input
                    name="minSeats"
                    type="number"
                    value={filters.minSeats}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="1"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="block w-full rounded-lg border-2 border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="departureTime">Departure Time</option>
                    <option value="price">Price (Low to High)</option>
                    <option value="duration">Duration (Shortest First)</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end col-span-2">
                  <button
                    onClick={clearFilters}
                    className="w-full rounded-lg bg-gray-200 px-6 py-2 text-gray-700 font-semibold hover:bg-gray-300 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching for trips...</p>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800 mb-8">
            {error}
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {results.length} trips found
              </h3>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.scheduleId} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{formatTime(result.departureTime)}</div>
                          <div className="text-sm text-gray-500">{result.route.origin}</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-sm text-gray-500">{formatDuration(result.route.estimatedDuration)}</div>
                          <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded"></div>
                          <div className="text-xs text-gray-400">{result.route.distance} km</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{formatTime(result.arrivalTime)}</div>
                          <div className="text-sm text-gray-500">{result.route.destination}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {result.route.name}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                          {result.bus.busType}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                          {result.bus.registrationNumber}
                        </span>
                      </div>

                      {result.bus.facilities && result.bus.facilities.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {result.bus.facilities.map((facility) => (
                            <span key={facility} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                              {facility.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Availability & Price */}
                    <div className="flex md:flex-col items-center md:items-end gap-4">
                      <div className="text-center md:text-right">
                        <div className="text-3xl font-bold text-blue-600">Rs. {result.route.fare}</div>
                        <div className="text-sm text-gray-500">per seat</div>
                      </div>

                      <div className="text-center md:text-right">
                        <div className={`text-lg font-semibold ${result.availableSeats < 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {result.availableSeats} seats left
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.bookedSeats}/{result.totalSeats} booked ({result.occupancyRate}%)
                        </div>
                      </div>

                      <Link href={`/booking/${result.scheduleId}`}>
                        <button className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2 text-white font-semibold hover:shadow-lg transition-all whitespace-nowrap">
                          Book Now →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Routes (shown when no results) */}
        {!loading && results.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Popular Routes</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { from: 'Colombo', to: 'Kandy', duration: '3h 30m', price: '250' },
                { from: 'Colombo', to: 'Galle', duration: '2h 15m', price: '180' },
                { from: 'Kandy', to: 'Nuwara Eliya', duration: '2h 45m', price: '200' },
                { from: 'Colombo', to: 'Jaffna', duration: '6h 30m', price: '450' },
              ].map((route, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      origin: route.from,
                      destination: route.to,
                    }));
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="font-semibold text-gray-900">{route.from} → {route.to}</div>
                  <div className="text-sm text-gray-600 mt-1">{route.duration}</div>
                  <div className="text-blue-600 font-bold mt-2">From Rs. {route.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
