"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  notes?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  onLeaveDays: number;
  totalHours: string;
  attendanceRate: string;
  workingDaysInMonth: number;
}

interface TodayAttendance {
  _id: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  notes?: string;
}

export default function DriverAttendancePage() {
  const router = useRouter();
  const { user, tokens, isAuthenticated, isLoading: authLoading } = useAuth();

  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check authentication
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
      // Set current month as default
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(monthStr);
      
      fetchData(monthStr);
    }
  }, [isAuthenticated, authLoading, user, tokens, router]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchData = async (month: string) => {
    setLoading(true);
    setError("");
    
    try {
      const headers = {
        Authorization: `Bearer ${tokens?.accessToken}`,
      };

      // Fetch all data in parallel
      const [todayRes, recordsRes, statsRes] = await Promise.all([
        fetch("/api/attendance/today", { headers }),
        fetch(`/api/attendance?month=${month}`, { headers }),
        fetch(`/api/attendance/stats?month=${month}`, { headers }),
      ]);

      if (todayRes.ok) {
        const todayData = await todayRes.json();
        setTodayAttendance(todayData.data);
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        setAttendanceRecords(recordsData.data);
      } else {
        const errorData = await recordsRes.json();
        setError(errorData.error || "Failed to fetch attendance records");
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check in");
      }

      setSuccess(data.message);
      setNotes("");
      
      // Refresh data
      await fetchData(selectedMonth);

    } catch (err: any) {
      console.error("Error checking in:", err);
      setError(err.message || "Failed to check in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/attendance/checkout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check out");
      }

      setSuccess(data.message);
      setNotes("");
      
      // Refresh data
      await fetchData(selectedMonth);

    } catch (err: any) {
      console.error("Error checking out:", err);
      setError(err.message || "Failed to check out");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value;
    setSelectedMonth(month);
    fetchData(month);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const calculateWorkHours = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return "In Progress";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(2)} hrs`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on_leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading attendance...</p>
        </div>
      </div>
    );
  }

  const isCheckedIn = todayAttendance !== null;
  const isCheckedOut = todayAttendance?.checkOutTime !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📋 Attendance Management
          </h1>
          <p className="text-lg text-gray-600">Track your check-in/check-out times and attendance history</p>
        </div>

        {/* Current Time Display */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Current Time</p>
              <p className="text-4xl font-bold">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true 
                })}
              </p>
              <p className="text-sm opacity-90 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Status</p>
              <p className="text-2xl font-bold">
                {isCheckedOut ? "✓ Checked Out" : isCheckedIn ? "🟢 Checked In" : "⚪ Not Checked In"}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✓</span>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Check In/Out */}
          <div className="lg:col-span-1">
            
            {/* Today's Attendance Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Today's Attendance
              </h2>

              {isCheckedIn ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Check-In Time</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatTime(todayAttendance.checkInTime)}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(todayAttendance.status)}`}>
                      {todayAttendance.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {isCheckedOut ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Check-Out Time</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatTime(todayAttendance.checkOutTime!)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Work Hours: {calculateWorkHours(todayAttendance.checkInTime, todayAttendance.checkOutTime)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes for checkout..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        disabled={submitting}
                      />
                      <button
                        onClick={handleCheckOut}
                        disabled={submitting}
                        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Checking Out..." : "🔴 Check Out"}
                      </button>
                    </div>
                  )}

                  {todayAttendance.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                      <p className="text-sm text-gray-600">{todayAttendance.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⏰ You haven't checked in today yet
                    </p>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for check-in..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4"
                    rows={3}
                    disabled={submitting}
                  />

                  <button
                    onClick={handleCheckIn}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Checking In..." : "🟢 Check In Now"}
                  </button>

                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Expected check-in time: 9:00 AM
                  </p>
                </div>
              )}
            </div>

            {/* Statistics Card */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📊</span>
                  Monthly Statistics
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Attendance Rate</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-xs text-gray-600 mb-1">Present</p>
                      <p className="text-2xl font-bold text-green-700">{stats.presentDays}</p>
                    </div>

                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <p className="text-xs text-gray-600 mb-1">Late</p>
                      <p className="text-2xl font-bold text-yellow-700">{stats.lateDays}</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1">On Leave</p>
                      <p className="text-2xl font-bold text-blue-700">{stats.onLeaveDays}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                      <p className="text-xl font-bold text-purple-700">{stats.totalHours}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Days</span>
                      <span className="font-bold text-gray-900">{stats.totalDays} / {stats.workingDaysInMonth}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              
              {/* Header with Month Filter */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">📜</span>
                  Attendance History
                </h2>

                <div className="flex items-center gap-2">
                  <label htmlFor="month" className="text-sm font-medium text-gray-700">
                    Month:
                  </label>
                  <select
                    id="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {generateMonthOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Records Table */}
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg font-medium">No attendance records found</p>
                  <p className="text-gray-400 text-sm mt-2">Check in to start tracking your attendance</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Check-In
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Check-Out
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceRecords.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(record.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-semibold">
                              {formatTime(record.checkInTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-semibold">
                              {record.checkOutTime ? formatTime(record.checkOutTime) : (
                                <span className="text-orange-600 font-medium">In Progress</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {calculateWorkHours(record.checkInTime, record.checkOutTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${getStatusBadge(record.status)}`}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {record.notes || '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
