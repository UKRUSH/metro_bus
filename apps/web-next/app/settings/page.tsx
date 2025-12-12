'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { changePasswordSchema } from '@metro/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, tokens, logout } = useAuth();
  
  const [activeSection, setActiveSection] = useState<'password' | 'notifications' | 'account'>('password');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    const result = changePasswordSchema.safeParse({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });

    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        newErrors[field] = error.message;
      });
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!validatePassword()) {
      return;
    }

    if (!user || !tokens) {
      setPasswordMessage({ type: 'error', text: 'Authentication required' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch(`/api/users/${user._id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordMessage({ type: 'success', text: data.message });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Logout after 2 seconds
      setTimeout(async () => {
        await logout();
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    if (!user || !tokens) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      await logout();
      router.push('/');
    } catch (error: any) {
      alert(error.message);
      setIsDeletingAccount(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-4 shadow">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection('password')}
                  className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium ${
                    activeSection === 'password'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveSection('notifications')}
                  className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium ${
                    activeSection === 'notifications'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveSection('account')}
                  className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium ${
                    activeSection === 'account'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Account
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Change Password */}
            {activeSection === 'password' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Change Password</h2>

                {passwordMessage.text && (
                  <div
                    className={`mb-6 rounded-lg p-4 text-sm ${
                      passwordMessage.type === 'success'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-lg border ${
                        passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-lg border ${
                        passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Min 8 characters, 1 uppercase, 1 lowercase, 1 number
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-lg border ${
                        passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <p className="font-medium text-gray-900">Booking Confirmations</p>
                      <p className="text-sm text-gray-500">Receive emails for booking confirmations</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <p className="font-medium text-gray-900">Trip Reminders</p>
                      <p className="text-sm text-gray-500">Get notified before your scheduled trips</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <p className="font-medium text-gray-900">Promotional Emails</p>
                      <p className="text-sm text-gray-500">Receive offers and promotions</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-500">Get SMS for important updates</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Management */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">Account Status</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Status</span>
                      <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Verified</span>
                      <span className={`font-medium ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-red-50 p-6 shadow">
                  <h2 className="mb-4 text-xl font-semibold text-red-900">Delete Account</h2>
                  <p className="mb-4 text-sm text-red-700">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-red-900">
                          Type <strong>DELETE</strong> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-red-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                          placeholder="DELETE"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
                        >
                          {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText('');
                          }}
                          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
