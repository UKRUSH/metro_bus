'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DriverRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Personal Identification
    fullName: '',
    nicNumber: '',
    dateOfBirth: '',
    gender: '',
    permanentAddress: '',
    currentAddress: '',
    sameAddress: true,
    mobileNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactNumber: '',
    
    // Legal & License Verification
    licenseNumber: '',
    licenseExpiry: '',
    licenseType: '',
    licenseIssuedDistrict: '',
    licenseFrontImage: null as File | null,
    licenseBackImage: null as File | null,
    
    // System Login & Verification
    password: '',
    confirmPassword: '',
    profilePhoto: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.nicNumber || !formData.dateOfBirth || 
        !formData.gender || !formData.permanentAddress || !formData.mobileNumber || 
        !formData.email) {
      setError('Please fill all required fields in Personal Information');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.licenseNumber || !formData.licenseExpiry || !formData.licenseType || 
        !formData.licenseIssuedDistrict) {
      setError('Please fill all required license information');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill all login credentials');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep3()) return;

    try {
      setLoading(true);

      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && !(value instanceof File)) {
          submitData.append(key, value.toString());
        }
      });

      // Add files
      if (formData.licenseFrontImage) {
        submitData.append('licenseFrontImage', formData.licenseFrontImage);
      }
      if (formData.licenseBackImage) {
        submitData.append('licenseBackImage', formData.licenseBackImage);
      }
      if (formData.profilePhoto) {
        submitData.append('profilePhoto', formData.profilePhoto);
      }

      // Add role
      submitData.append('role', 'driver');

      const response = await fetch('/api/auth/register/driver', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Driver registration successful! Please wait for admin approval.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Metro Bus</h1>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Driver Registration</h2>
          <p className="mt-2 text-gray-600">Complete all steps to register as a driver</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Personal Info</span>
            <span>License Details</span>
            <span>Login Credentials</span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Personal Identification */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Personal Identification</h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name (as per NIC) *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIC Number *</label>
                    <input
                      type="text"
                      name="nicNumber"
                      value={formData.nicNumber}
                      onChange={handleInputChange}
                      placeholder="123456789V or 199812345678"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Permanent Address *</label>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="sameAddress"
                        checked={formData.sameAddress}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Current address is same as permanent address</span>
                    </label>
                  </div>

                  {!formData.sameAddress && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Current Address</label>
                      <textarea
                        name="currentAddress"
                        value={formData.currentAddress}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="+94771234567"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="mb-3 font-medium text-gray-900">Emergency Contact</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Name *</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relation *</label>
                    <input
                      type="text"
                      name="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={handleInputChange}
                      placeholder="e.g., Spouse, Parent, Sibling"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number *</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      placeholder="+94771234567"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: License Verification */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">License Verification</h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Driving License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="B1234567"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Expiry Date *</label>
                    <input
                      type="date"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Type *</label>
                    <select
                      name="licenseType"
                      value={formData.licenseType}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    >
                      <option value="">Select License Type</option>
                      <option value="D1">D1 - Light Vehicle</option>
                      <option value="D">D - Heavy Vehicle</option>
                      <option value="passenger-transport">Passenger Transport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Issued District *</label>
                    <input
                      type="text"
                      name="licenseIssuedDistrict"
                      value={formData.licenseIssuedDistrict}
                      onChange={handleInputChange}
                      placeholder="e.g., Colombo"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Front Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'licenseFrontImage')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Upload clear image of license front side</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Back Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'licenseBackImage')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Upload clear image of license back side</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Login Credentials */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Login Credentials</h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profilePhoto')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Upload your profile photo</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 characters"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900">Registration Review</h4>
                  <p className="mt-2 text-sm text-blue-700">
                    Your driver registration will be reviewed by the admin team. You will receive a notification once approved.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="rounded-lg border border-gray-300 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-8 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
