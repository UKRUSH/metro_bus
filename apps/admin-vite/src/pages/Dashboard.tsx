import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.profile.firstName}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <DashboardCard title="Total Buses" value="45" color="bg-blue-600" icon="bus" />
            <DashboardCard title="Active Routes" value="12" color="bg-green-600" icon="route" />
            <DashboardCard title="Today's Bookings" value="238" color="bg-purple-600" icon="ticket" />
            <DashboardCard title="Total Revenue" value="$12.5K" color="bg-yellow-600" icon="revenue" />
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ActionCard icon="plus" title="Add New Bus" description="Register a new bus" />
              <ActionCard icon="clipboard" title="Manage Routes" description="Edit or create routes" />
              <ActionCard icon="users" title="User Management" description="Manage users & drivers" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, value, color, icon }: { title: string; value: string; color: string; icon: string }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} rounded-full p-3`}>
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <button className="flex items-center gap-3 rounded-lg bg-white p-4 text-left shadow hover:shadow-md transition-shadow">
      <div className="rounded-full bg-blue-100 p-2">
        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
}
