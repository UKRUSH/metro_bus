'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Owner {
  _id: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

interface Route {
  _id: string;
  name: string;
  code: string;
}

interface Driver {
  _id: string;
  fullName: string;
}

interface Bus {
  _id: string;
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer?: string;
  busModel?: string;
  yearOfManufacture?: number;
  ownerId?: Owner | string;
  isActive: boolean;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  routeId?: Route | string;
  driverId?: Driver | string;
  currentStatus: 'available' | 'in-service' | 'maintenance' | 'retired';
  facilities: string[];
  permitExpiryDate?: string;
  insuranceExpiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface BusFormData {
  registrationNumber: string;
  capacity: number;
  busType: string;
  manufacturer: string;
  busModel: string;
  yearOfManufacture: number;
  routeId: string;
  currentStatus: string;
  facilities: string[];
  maintenanceNotes: string;
}

export default function AdminBusesPage() {
  const router = useRouter();
  const { user, isAuthenticated, tokens } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  
  const [formData, setFormData] = useState<BusFormData>({
    registrationNumber: '',
    capacity: 50,
    busType: 'Standard',
    manufacturer: '',
    busModel: '',
    yearOfManufacture: new Date().getFullYear(),
    routeId: '',
    currentStatus: 'available',
    facilities: [],
    maintenanceNotes: '',
  });

  const facilityOptions = ['wifi', 'ac', 'wheelchair_accessible', 'cctv', 'gps', 'first_aid', 'fire_extinguisher'];
  const busTypes = ['Standard', 'Luxury', 'Express', 'AC', 'Non-AC', 'Double Decker'];

  useEffect(() => {
    console.log('Auth check - isAuthenticated:', isAuthenticated);
    console.log('User:', user);
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['ADMIN', 'OWNER', 'admin', 'owner'];
    if (user && !allowedRoles.includes(user.role)) {
      console.log('Access denied. User role:', user.role);
      alert('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }

    fetchBuses();
    fetchRoutes();
  }, [isAuthenticated, user, router]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buses', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch buses');
      }

      const result = await response.json();
      console.log('Fetched buses:', result);
      
      const busesData = result.data?.buses || result.buses || [];
      setBuses(busesData);
    } catch (err: any) {
      console.error('Fetch buses error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes', {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const routesData = result.data?.routes || result.routes || [];
        setRoutes(routesData);
      }
    } catch (err) {
      console.error('Fetch routes error:', err);
    }
  };

  const handleCreateBus = async () => {
    try {
      const response = await fetch('/api/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          yearOfManufacture: Number(formData.yearOfManufacture),
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bus');
      }

      alert('Bus created successfully!');
      setShowCreateModal(false);
      resetForm();
      await fetchBuses();
    } catch (err: any) {
      console.error('Create bus error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateBus = async () => {
    if (!editingBus) return;

    try {
      const response = await fetch(`/api/buses/${editingBus._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          yearOfManufacture: Number(formData.yearOfManufacture),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bus');
      }

      alert('Bus updated successfully!');
      setShowEditModal(false);
      setEditingBus(null);
      resetForm();
      await fetchBuses();
    } catch (err: any) {
      console.error('Update bus error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!confirm('Are you sure you want to delete this bus? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete bus');
      }

      alert('Bus deleted successfully!');
      await fetchBuses();
    } catch (err: any) {
      console.error('Delete bus error:', err);
      alert('Error: ' + err.message);
    }
  };

  const openEditModal = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      registrationNumber: bus.registrationNumber,
      capacity: bus.capacity,
      busType: bus.busType,
      manufacturer: bus.manufacturer || '',
      busModel: bus.busModel || '',
      yearOfManufacture: bus.yearOfManufacture || new Date().getFullYear(),
      routeId: typeof bus.routeId === 'object' && bus.routeId ? bus.routeId._id : '',
      currentStatus: bus.currentStatus,
      facilities: bus.facilities || [],
      maintenanceNotes: bus.maintenanceNotes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      registrationNumber: '',
      capacity: 50,
      busType: 'Standard',
      manufacturer: '',
      busModel: '',
      yearOfManufacture: new Date().getFullYear(),
      routeId: '',
      currentStatus: 'available',
      facilities: [],
      maintenanceNotes: '',
    });
  };

  const getOwnerName = (bus: Bus): string => {
    if (typeof bus.ownerId === 'object' && bus.ownerId) {
      const { firstName, lastName } = bus.ownerId.profile || {};
      return `${firstName || ''} ${lastName || ''}`.trim() || bus.ownerId.email;
    }
    return 'N/A';
  };

  const getRouteName = (bus: Bus): string => {
    if (typeof bus.routeId === 'object' && bus.routeId) {
      return `${bus.routeId.name} (${bus.routeId.code})`;
    }
    return 'Not Assigned';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      'in-service': 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesSearch = 
      bus.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.busType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOwnerName(bus).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bus.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 p-2 text-white transition-all hover:scale-110 hover:shadow-lg">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Bus Management
                </h1>
                <p className="text-gray-600 mt-1">Manage fleet, maintenance, and assignments</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-white font-medium hover:shadow-lg transition-all"
            >
              ➕ Add New Bus
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search by registration, type, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="in-service">In Service</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Buses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuses.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-lg">
              <p className="text-gray-500 text-lg">No buses found</p>
            </div>
          ) : (
            filteredBuses.map((bus) => (
              <div key={bus._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{bus.registrationNumber}</h3>
                      <p className="text-blue-100">{bus.busType}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(bus.currentStatus)}`}>
                      {bus.currentStatus.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold">{bus.capacity} seats</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manufacturer:</span>
                      <span className="font-semibold">{bus.manufacturer || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-semibold">{bus.busModel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-semibold">{bus.yearOfManufacture || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-semibold text-blue-600">{getRouteName(bus)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-semibold">{getOwnerName(bus)}</span>
                    </div>
                    
                    {bus.facilities && bus.facilities.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-600 mb-2">Facilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {bus.facilities.map((facility) => (
                            <span key={facility} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {facility.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bus.nextMaintenanceDate && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-600">Next Maintenance:</p>
                        <p className="text-sm font-semibold text-orange-600">
                          {new Date(bus.nextMaintenanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEditModal(bus)}
                      className="flex-1 rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus._id)}
                      className="flex-1 rounded-lg bg-red-600 text-white py-2 hover:bg-red-700 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Buses</div>
            <div className="text-3xl font-bold text-blue-600">{buses.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Available</div>
            <div className="text-3xl font-bold text-green-600">
              {buses.filter(b => b.currentStatus === 'available').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">In Service</div>
            <div className="text-3xl font-bold text-blue-600">
              {buses.filter(b => b.currentStatus === 'in-service').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Maintenance</div>
            <div className="text-3xl font-bold text-yellow-600">
              {buses.filter(b => b.currentStatus === 'maintenance').length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-2">Total Capacity</div>
            <div className="text-3xl font-bold text-purple-600">
              {buses.reduce((sum, b) => sum + b.capacity, 0)}
            </div>
          </div>
        </div>
      </main>

      {/* Create Bus Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">Add New Bus</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type *</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {busTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.currentStatus}
                    onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="in-service">In Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.busModel}
                    onChange={(e) => setFormData({...formData, busModel: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Manufacture</label>
                  <input
                    type="number"
                    value={formData.yearOfManufacture}
                    onChange={(e) => setFormData({...formData, yearOfManufacture: Number(e.target.value)})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Route</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.name} ({route.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {facilityOptions.map(facility => (
                    <label key={facility} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, facilities: [...formData.facilities, facility]});
                          } else {
                            setFormData({...formData, facilities: formData.facilities.filter(f => f !== facility)});
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{facility.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
                <textarea
                  value={formData.maintenanceNotes}
                  onChange={(e) => setFormData({...formData, maintenanceNotes: e.target.value})}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={handleCreateBus}
                className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 transition-all"
              >
                Create Bus
              </button>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 rounded-lg bg-gray-300 text-gray-700 py-2 font-medium hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {showEditModal && editingBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">Edit Bus: {editingBus.registrationNumber}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: Number(e.target.value)})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type *</label>
                  <select
                    value={formData.busType}
                    onChange={(e) => setFormData({...formData, busType: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    {busTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.currentStatus}
                    onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="in-service">In Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.busModel}
                    onChange={(e) => setFormData({...formData, busModel: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Manufacture</label>
                  <input
                    type="number"
                    value={formData.yearOfManufacture}
                    onChange={(e) => setFormData({...formData, yearOfManufacture: Number(e.target.value)})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Route</label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">No Route</option>
                    {routes.map(route => (
                      <option key={route._id} value={route._id}>
                        {route.name} ({route.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {facilityOptions.map(facility => (
                    <label key={facility} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, facilities: [...formData.facilities, facility]});
                          } else {
                            setFormData({...formData, facilities: formData.facilities.filter(f => f !== facility)});
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{facility.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
                <textarea
                  value={formData.maintenanceNotes}
                  onChange={(e) => setFormData({...formData, maintenanceNotes: e.target.value})}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={handleUpdateBus}
                className="flex-1 rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 transition-all"
              >
                Update Bus
              </button>
              <button
                onClick={() => { setShowEditModal(false); setEditingBus(null); resetForm(); }}
                className="flex-1 rounded-lg bg-gray-300 text-gray-700 py-2 font-medium hover:bg-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
