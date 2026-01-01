"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Trip {
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
    capacity: number;
  };
  routeId: {
    _id: string;
    name: string;
    origin: string;
    destination: string;
  };
  scheduleId?: {
    _id: string;
    departureTime: string;
    arrivalTime: string;
  };
  startTime: string;
  endTime?: string;
  startLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: "started" | "in_progress" | "completed" | "cancelled";
  passengersCount?: number;
  distanceCovered?: number;
  notes?: string;
  endNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
}

interface Route {
  _id: string;
  name: string;
  origin: string;
  destination: string;
}

export default function DriverTripsPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading: authLoading } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);

  // Start trip state
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [startNotes, setStartNotes] = useState("");

  // End trip form state
  const [endNotes, setEndNotes] = useState("");
  const [passengersCount, setPassengersCount] = useState("");
  const [distanceCovered, setDistanceCovered] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "driver" && user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    fetchTrips();
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    }
  }, [filterStatus]);

  const fetchTrips = async () => {
    if (!tokens?.accessToken) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filterStatus) {
        params.append("status", filterStatus);
      }

      const url = `/api/drivers/trips?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch trips");
      }

      const data = await response.json();
      console.log("Fetched trips data:", data);
      console.log("Trips array:", data.trips);
      console.log("Number of trips:", data.trips?.length || 0);
      
      const tripsData = data.trips || [];
      setTrips(tripsData);
      
      // Log trip statuses
      if (tripsData.length > 0) {
        console.log("Trip statuses:", tripsData.map((t: Trip) => ({ id: t._id, status: t.status })));
        console.log("Active trips:", tripsData.filter((t: Trip) => t.status === "started" || t.status === "in_progress"));
      }
    } catch (err: any) {
      console.error("Error fetching trips:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusesAndRoutes = async () => {
    if (!tokens?.accessToken) return;

    try {
      const [busesRes, routesRes] = await Promise.all([
        fetch("/api/buses", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }),
        fetch("/api/routes", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }),
      ]);

      if (busesRes.ok) {
        const busesData = await busesRes.json();
        const busesList = Array.isArray(busesData)
          ? busesData
          : busesData.buses || busesData.data || [];
        setBuses(Array.isArray(busesList) ? busesList : []);
      }

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        const routesList = Array.isArray(routesData)
          ? routesData
          : routesData.routes || routesData.data || [];
        setRoutes(Array.isArray(routesList) ? routesList : []);
      }
    } catch (err: any) {
      console.error("Failed to fetch buses/routes:", err);
      setBuses([]);
      setRoutes([]);
    }
  };

  const handleStartTrip = async () => {
    if (!selectedBusId || !selectedRouteId || !tokens?.accessToken) {
      setError("Please select both bus and route");
      return;
    }

    try {
      setStartingTrip(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/drivers/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          busId: selectedBusId,
          routeId: selectedRouteId,
          notes: startNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start trip");
      }

      setSuccess("Trip started successfully!");
      setShowStartTripModal(false);
      setSelectedBusId("");
      setSelectedRouteId("");
      setStartNotes("");
      fetchTrips();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStartingTrip(false);
    }
  };

  const handleEndTrip = async () => {
    if (!selectedTrip || !tokens?.accessToken) return;

    try {
      setEndingTrip(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/drivers/trips/${selectedTrip._id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          endNotes: endNotes.trim() || undefined,
          passengersCount: passengersCount ? parseInt(passengersCount) : undefined,
          distanceCovered: distanceCovered ? parseFloat(distanceCovered) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to end trip");
      }

      setSuccess("Trip ended successfully!");
      setShowEndTripModal(false);
      setSelectedTrip(null);
      setEndNotes("");
      setPassengersCount("");
      setDistanceCovered("");
      fetchTrips();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEndingTrip(false);
    }
  };

  const openEndTripModal = (trip: Trip) => {
    setError("");
    setSuccess("");
    setSelectedTrip(trip);
    setEndNotes("");
    setPassengersCount("");
    setDistanceCovered("");
    setShowEndTripModal(true);
  };

  const openDetailsModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      started: "bg-green-100 text-green-800 border-green-200",
      in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading trips...</p>
        </div>
      </div>
    );
  }

  const activeTrips = trips.filter((t) => t.status === "started" || t.status === "in_progress");
  const completedTrips = trips.filter((t) => t.status === "completed");
  const totalDistance = trips.reduce((sum, t) => sum + (t.distanceCovered || 0), 0);
  const totalPassengers = trips.reduce((sum, t) => sum + (t.passengersCount || 0), 0);

  // Debug logging
  console.log("Total trips:", trips.length);
  console.log("Active trips count:", activeTrips.length);
  console.log("Completed trips count:", completedTrips.length);
  console.log("All trip statuses:", trips.map(t => t.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">🚌 Trip Logs</h1>
              <p className="text-gray-600">Track and manage your bus trip records</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  fetchBusesAndRoutes();
                  setShowStartTripModal(true);
                  setError("");
                  setSuccess("");
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Start New Trip
              </button>
              <button
                onClick={() => router.push("/driver")}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✓</span>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Trips</p>
                <p className="text-3xl font-bold text-gray-900">{trips.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Trips</p>
                <p className="text-3xl font-bold text-green-600">{activeTrips.length}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{completedTrips.length}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Distance</p>
                <p className="text-3xl font-bold text-purple-600">{totalDistance.toFixed(1)} km</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Trips</option>
                <option value="started">Started Only</option>
                <option value="in_progress">In Progress Only</option>
                <option value="completed">Completed Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
            </div>

            <button
              onClick={fetchTrips}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold disabled:opacity-50"
            >
              <svg
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading trips...</p>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trips Found</h2>
            <p className="text-gray-600 mb-6">
              {filterStatus
                ? `No ${filterStatus} trips available`
                : "You haven't started any trips yet"}
            </p>
            <button
              onClick={() => {
                fetchBusesAndRoutes();
                setShowStartTripModal(true);
                setError("");
                setSuccess("");
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Start Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">
                        🚍 {trip.busId.registrationNumber}
                      </h3>
                      {getStatusBadge(trip.status)}
                      {(trip.status === "started" || trip.status === "in_progress") && (
                        <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">
                      {trip.busId.busType} • {trip.busId.capacity} seats
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      📍 {trip.routeId.origin} → {trip.routeId.destination}
                    </p>
                    <p className="text-sm text-gray-500">{trip.routeId.name}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatDuration(trip.startTime, trip.endTime)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Start Time</p>
                    <p className="text-sm font-semibold text-gray-900">{formatTime(trip.startTime)}</p>
                  </div>

                  {trip.endTime && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-1">End Time</p>
                      <p className="text-sm font-semibold text-gray-900">{formatTime(trip.endTime)}</p>
                    </div>
                  )}

                  {trip.passengersCount !== undefined && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-600 mb-1">Passengers</p>
                      <p className="text-sm font-bold text-blue-900">{trip.passengersCount}</p>
                    </div>
                  )}

                  {trip.distanceCovered !== undefined && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs font-medium text-purple-600 mb-1">Distance</p>
                      <p className="text-sm font-bold text-purple-900">{trip.distanceCovered} km</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => openDetailsModal(trip)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Details
                  </button>

                  {(trip.status === "started" || trip.status === "in_progress") && (
                    <button
                      onClick={() => openEndTripModal(trip)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                        />
                      </svg>
                      End Trip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Trip Modal */}
      {showStartTripModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🚀 Start New Trip</h2>
              <button
                onClick={() => {
                  setShowStartTripModal(false);
                  setSelectedBusId("");
                  setSelectedRouteId("");
                  setStartNotes("");
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Bus *
                </label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={startingTrip}
                >
                  <option value="">Choose a bus...</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.registrationNumber} - {bus.busType} ({bus.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Route *
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={startingTrip}
                >
                  <option value="">Choose a route...</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.origin} → {route.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  placeholder="Add any notes about this trip..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={startingTrip}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowStartTripModal(false);
                    setSelectedBusId("");
                    setSelectedRouteId("");
                    setStartNotes("");
                    setError("");
                  }}
                  disabled={startingTrip}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTrip}
                  disabled={startingTrip || !selectedBusId || !selectedRouteId}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startingTrip ? "Starting..." : "Start Trip"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Trip Modal */}
      {showEndTripModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🛑 End Trip</h2>
              <button
                onClick={() => {
                  setShowEndTripModal(false);
                  setSelectedTrip(null);
                  setEndNotes("");
                  setPassengersCount("");
                  setDistanceCovered("");
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Bus:</span> {selectedTrip.busId.registrationNumber}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Route:</span> {selectedTrip.routeId.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Started:</span> {formatTime(selectedTrip.startTime)}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Passengers (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={passengersCount}
                  onChange={(e) => setPassengersCount(e.target.value)}
                  placeholder="Enter number of passengers"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={endingTrip}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Distance Covered (km) (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={distanceCovered}
                  onChange={(e) => setDistanceCovered(e.target.value)}
                  placeholder="Enter distance in km"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={endingTrip}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Notes (Optional)
                </label>
                <textarea
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  placeholder="Any final notes about this trip..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={endingTrip}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEndTripModal(false);
                    setSelectedTrip(null);
                    setEndNotes("");
                    setPassengersCount("");
                    setDistanceCovered("");
                    setError("");
                  }}
                  disabled={endingTrip}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndTrip}
                  disabled={endingTrip}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-semibold transition-all shadow-lg disabled:opacity-50"
                >
                  {endingTrip ? "Ending..." : "Confirm End Trip"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">📋 Trip Details</h2>
                <p className="text-gray-600">Complete information about this trip</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTrip(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Status</h3>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedTrip.status)}
                  {(selectedTrip.status === "started" || selectedTrip.status === "in_progress") && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Currently Running
                    </span>
                  )}
                </div>
              </div>

              {/* Bus & Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-700 mb-3">🚍 Bus Information</h3>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-blue-900">
                      {selectedTrip.busId.registrationNumber}
                    </p>
                    <p className="text-sm text-blue-700">Type: {selectedTrip.busId.busType}</p>
                    <p className="text-sm text-blue-700">Capacity: {selectedTrip.busId.capacity} seats</p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-700 mb-3">📍 Route Information</h3>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-purple-900">{selectedTrip.routeId.name}</p>
                    <p className="text-sm text-purple-700">From: {selectedTrip.routeId.origin}</p>
                    <p className="text-sm text-purple-700">To: {selectedTrip.routeId.destination}</p>
                  </div>
                </div>
              </div>

              {/* Time Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">⏰ Time Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Start Time:</span>
                    <span className="font-bold text-gray-900">{formatTime(selectedTrip.startTime)}</span>
                  </div>
                  {selectedTrip.endTime && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">End Time:</span>
                        <span className="font-bold text-gray-900">{formatTime(selectedTrip.endTime)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                        <span className="text-gray-700 font-semibold">Total Duration:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatDuration(selectedTrip.startTime, selectedTrip.endTime)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Statistics */}
              {(selectedTrip.passengersCount !== undefined ||
                selectedTrip.distanceCovered !== undefined) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">📊 Trip Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTrip.passengersCount !== undefined && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-sm text-green-600 font-medium mb-1">Total Passengers</p>
                        <p className="text-3xl font-bold text-green-900">{selectedTrip.passengersCount}</p>
                      </div>
                    )}
                    {selectedTrip.distanceCovered !== undefined && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium mb-1">Distance Covered</p>
                        <p className="text-3xl font-bold text-purple-900">
                          {selectedTrip.distanceCovered} <span className="text-lg">km</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedTrip.notes || selectedTrip.endNotes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">📝 Notes</h3>
                  <div className="space-y-3">
                    {selectedTrip.notes && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-blue-700 mb-2">Start Notes:</p>
                        <p className="text-blue-900">{selectedTrip.notes}</p>
                      </div>
                    )}
                    {selectedTrip.endNotes && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-sm font-semibold text-green-700 mb-2">End Notes:</p>
                        <p className="text-green-900">{selectedTrip.endNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Driver Info */}
              {selectedTrip.driverId && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3">👤 Driver Information</h3>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="font-bold text-gray-900 text-lg mb-1">{selectedTrip.driverId.fullName}</p>
                    <p className="text-sm text-gray-600">
                      License: {selectedTrip.driverId.licenseNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTrip(null);
                }}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
