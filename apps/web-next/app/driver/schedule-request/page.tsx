"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Assignment {
  _id: string;
  driverId: {
    fullName: string;
    licenseNumber: string;
  };
  busId: {
    registrationNumber: string;
    busType: string;
    capacity: number;
  };
  routeId: {
    name: string;
    origin: string;
    destination: string;
  };
  scheduleId?: {
    departureTime: string;
    arrivalTime: string;
  };
  assignmentDate: string;
  status: "pending" | "approved" | "rejected" | "active" | "completed";
  requestedBy: "driver" | "admin";
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface AvailableBus {
  _id: string;
  registrationNumber: string;
  busType: string;
  capacity: number;
  route: {
    _id: string;
    name: string;
    origin: string;
    destination: string;
  } | null;
}

export default function DriverScheduleRequestPage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"assignments" | "request">("assignments");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableBuses, setAvailableBuses] = useState<AvailableBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsDriverProfile, setNeedsDriverProfile] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedBusId, setSelectedBusId] = useState("");
  const [notes, setNotes] = useState("");

  // Check authentication and role
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!authLoading && user && user.role !== "driver" && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (isAuthenticated && tokens?.accessToken) {
      fetchMyAssignments();
    }
  }, [authLoading, isAuthenticated, user, tokens, router]);

  // Fetch assignments
  const fetchMyAssignments = async () => {
    if (!tokens?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = await fetch("/api/drivers/schedule-assignments", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 404) {
        const errorData = await response.json();
        if (errorData.error === "Driver profile not found") {
          setNeedsDriverProfile(true);
          setLoading(false);
          return;
        }
        setError("API route not found. Please restart the development server.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch assignments");
      }

      const data = await response.json();
      setAssignments(data.assignments || []);
      setNeedsDriverProfile(false);
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  // Fetch available buses for selected date
  const fetchAvailableBuses = async (date: string) => {
    if (!date || !tokens?.accessToken) return;

    try {
      setError("");
      const response = await fetch(`/api/drivers/available-assignments?date=${date}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        router.push("/login?error=session_expired");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch available buses");
      }

      const data = await response.json();
      console.log("Available buses response:", data);
      setAvailableBuses(data.availableBuses || []);
    } catch (err: any) {
      console.error("Error fetching available buses:", err);
      setError(err.message);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      await fetchMyAssignments();
      setLoading(false);
    };
    loadData();
  }, []);

  // Load available buses when date changes
  useEffect(() => {
    if (selectedDate && !needsDriverProfile) {
      fetchAvailableBuses(selectedDate);
    } else {
      setAvailableBuses([]);
    }
  }, [selectedDate, needsDriverProfile]);

  // Submit assignment request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDate || !selectedBusId) {
      setError("Please select a date and bus");
      return;
    }

    if (!tokens?.accessToken) {
      router.push("/login");
      return;
    }

    setSubmitting(true);

    try {

      const selectedBus = availableBuses.find((b) => b._id === selectedBusId);

      if (!selectedBus?.route?._id) {
        throw new Error("Selected bus has no route assigned");
      }

      const response = await fetch("/api/drivers/schedule-assignments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          busId: selectedBusId,
          routeId: selectedBus.route._id,
          assignmentDate: selectedDate,
          notes,
          requestedBy: "driver",
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login?error=session_expired");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || "Failed to submit request");
      }

      setSuccess("Assignment request submitted successfully! Waiting for admin approval.");

      // Reset form
      setSelectedDate("");
      setSelectedBusId("");
      setNotes("");
      setAvailableBuses([]);

      // Refresh assignments
      await fetchMyAssignments();

      // Switch to assignments tab after delay
      setTimeout(() => {
        setActiveTab("assignments");
        setSuccess("");
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting request:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    if (!tokens?.accessToken) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/drivers/schedule-assignments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login?error=session_expired");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete assignment");
      }

      setSuccess("Assignment deleted successfully");
      await fetchMyAssignments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error deleting assignment:", err);
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  // Show driver profile setup instructions
  if (needsDriverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-blue-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Driver Profile Required</h1>
            </div>
            <div className="p-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-12 w-12 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Setup Required
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Your user account exists, but you need a Driver profile to access schedule
                    assignments.
                  </p>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Follow these steps:
                    </h3>
                    <ol className="list-decimal list-inside space-y-3 text-gray-700">
                      <li className="font-medium">
                        Open a new terminal in your project directory
                      </li>
                      <li>
                        Run this command:
                        <div className="mt-2 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                          cd apps/web-next && npx tsx scripts/create-driver-profile.ts{" "}
                          <span className="text-yellow-400">your-email@example.com</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          (Replace with your login email)
                        </p>
                      </li>
                      <li>Wait for the success message</li>
                      <li>
                        <button
                          onClick={() => window.location.reload()}
                          className="text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Click here to reload this page
                        </button>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This is a one-time setup. The script will create
                      your driver profile with default values that you can update later.
                    </p>
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Back to Dashboard
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      I've Created the Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Assignment System</h1>
          <p className="mt-2 text-gray-600">
            Request bus assignments for specific dates or manage your current schedule
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex">
              <svg
                className="h-5 w-5 text-green-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("assignments")}
                className={`flex-1 py-4 px-6 text-center text-sm font-semibold transition-colors ${
                  activeTab === "assignments"
                    ? "border-b-3 border-blue-600 text-blue-600 bg-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center justify-center">
                  My Assignments
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {assignments.length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("request")}
                className={`flex-1 py-4 px-6 text-center text-sm font-semibold transition-colors ${
                  activeTab === "request"
                    ? "border-b-3 border-blue-600 text-blue-600 bg-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                Request New Assignment
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "assignments" ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Schedule Assignments</h2>
                  <button
                    onClick={() => fetchMyAssignments()}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
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

                {assignments.length === 0 ? (
                  <div className="text-center py-16">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No assignments yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Get started by requesting a new bus assignment
                    </p>
                    <div className="mt-8">
                      <button
                        onClick={() => setActiveTab("request")}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
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
                        Request Assignment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment._id}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {assignment.busId.registrationNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {assignment.busId.busType} • {assignment.busId.capacity} seats
                            </p>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                              {assignment.routeId.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.routeId.origin} → {assignment.routeId.destination}
                            </p>
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-4">
                          <div>
                            <span className="text-gray-500 block text-xs">Assignment Date</span>
                            <p className="font-semibold text-gray-900">
                              {new Date(assignment.assignmentDate).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Requested</span>
                            <p className="font-semibold text-gray-900">
                              {new Date(assignment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Requested By</span>
                            <p className="font-semibold text-gray-900 capitalize">
                              {assignment.requestedBy}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Driver</span>
                            <p className="font-semibold text-gray-900">
                              {assignment.driverId.fullName}
                            </p>
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="mt-4 bg-gray-50 rounded p-3">
                            <span className="text-xs text-gray-500 font-medium">Notes:</span>
                            <p className="text-sm text-gray-700 mt-1">{assignment.notes}</p>
                          </div>
                        )}

                        {assignment.rejectionReason && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
                            <span className="text-xs text-red-700 font-bold">
                              Rejection Reason:
                            </span>
                            <p className="text-sm text-red-600 mt-1">{assignment.rejectionReason}</p>
                          </div>
                        )}

                        {assignment.status === "pending" && (
                          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                            <button
                              onClick={() => handleDeleteAssignment(assignment._id)}
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Cancel Request
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Request New Assignment</h2>
                <form onSubmit={handleSubmitRequest} className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                          Assignment Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          required
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Select the date you want to be assigned to a bus
                        </p>
                      </div>

                      {selectedDate && (
                        <div>
                          <label
                            htmlFor="bus"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                          >
                            Available Bus & Route <span className="text-red-500">*</span>
                          </label>
                          {availableBuses.length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                              <div className="flex">
                                <svg
                                  className="h-5 w-5 text-yellow-600 mr-2"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-yellow-800">
                                    No buses available
                                  </p>
                                  <p className="text-xs text-yellow-700 mt-1">
                                    All buses are already assigned for this date. Please choose a
                                    different date.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <select
                              id="bus"
                              value={selectedBusId}
                              onChange={(e) => setSelectedBusId(e.target.value)}
                              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              required
                            >
                              <option value="">Select a bus and route...</option>
                              {availableBuses.map((bus) => (
                                <option key={bus._id} value={bus._id}>
                                  {bus.registrationNumber} - {bus.busType} ({bus.capacity} seats)
                                  {bus.route
                                    ? ` → ${bus.route.name} (${bus.route.origin} → ${bus.route.destination})`
                                    : " → No route assigned"}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="notes"
                          className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                          Additional Notes <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Any special requirements or information for the admin..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate("");
                        setSelectedBusId("");
                        setNotes("");
                        setError("");
                        setAvailableBuses([]);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !selectedBusId || availableBuses.length === 0}
                      className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
