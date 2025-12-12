'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfileSchema } from '@metro/shared';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, tokens } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phone: user.profile.phone || '',
        dateOfBirth: user.profile.dateOfBirth 
          ? new Date(user.profile.dateOfBirth).toISOString().split('T')[0]
          : '',
        address: user.profile.address || '',
        emergencyContact: user.profile.emergencyContact || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const dataToValidate: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    };

    if (formData.dateOfBirth) {
      dataToValidate.dateOfBirth = formData.dateOfBirth;
    }
    if (formData.address) {
      dataToValidate.address = formData.address;
    }
    if (formData.emergencyContact) {
      dataToValidate.emergencyContact = formData.emergencyContact;
    }

    const result = updateProfileSchema.safeParse(dataToValidate);

    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as string;
        newErrors[field] = error.message;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    if (!user || !tokens) {
      setApiError('Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      if (formData.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth;
      }
      if (formData.address) {
        updateData.address = formData.address;
      }
      if (formData.emergencyContact) {
        updateData.emergencyContact = formData.emergencyContact;
      }

      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error: any) {
      setApiError(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {apiError && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="0771234567"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                  Emergency Contact
                </label>
                <input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="0771234567"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your full address"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/profile"
                className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
