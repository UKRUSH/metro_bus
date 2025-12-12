'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OwnerRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    // Owner Identification
    ownerType: 'individual', // individual or company
    fullName: '',
    companyName: '',
    nicNumber: '',
    brNumber: '',
    permanentAddress: '',
    businessAddress: '',
    sameAddress: true,
    mobileNumber: '',
    email: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    
    // Vehicle Details (will be array, but starting with one)
    busRegistrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    routeNumbers: '',
    routePermitNumber: '',
    permitExpiryDate: '',
    vehicleType: '',
    seatingCapacity: '',
    insuranceType: '',
    insuranceExpiryDate: '',
    emissionTestCertificate: '',
    emissionTestExpiry: '',
    revenueLicenseNumber: '',
    revenueLicenseExpiry: '',
    
    // Bus Condition & Safety
    busCapacity: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    tyreConditionFront: '',
    tyreConditionRear: '',
    brakeTestReport: '',
    firstAidBoxAvailable: false,
    fireExtinguisherAvailable: false,
    cctvAvailable: false,
    gpsTrackerAvailable: false,
    
    // Document Uploads
    vehicleBookCopy: null as File | null,
    routePermitBookCopy: null as File | null,
    insuranceCertificate: null as File | null,
    revenueLicenseScan: null as File | null,
    ownerPhoto: null as File | null,
    fitnessReport: null as File | null,
    
    // System Access
    password: '',
    confirmPassword: '',
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
    
    if (file) {
      // Validate file type and size
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const validDocTypes = ['application/pdf'];
      const validTypes = [...validImageTypes, ...validDocTypes];
      
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type for ${fieldName}. Only JPG, PNG, WebP images and PDF documents are allowed.`);
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setError(`File size for ${fieldName} exceeds 5MB. Please upload a smaller file.`);
        e.target.value = ''; // Clear the input
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  // Validation helper functions
  const validatePhoneNumber = (phone: string): boolean => {
    // Sri Lankan phone number format: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateNIC = (nic: string): boolean => {
    // Old NIC: 9 digits + V/X, New NIC: 12 digits
    const oldNICRegex = /^\d{9}[VvXx]$/;
    const newNICRegex = /^\d{12}$/;
    return oldNICRegex.test(nic) || newNICRegex.test(nic);
  };

  const validateVehicleRegistration = (regNo: string): boolean => {
    // Sri Lankan vehicle registration format: ABC-1234 or AB-1234 or ABC1234
    const regNoRegex = /^[A-Z]{2,3}[-]?\d{4}$/i;
    return regNoRegex.test(regNo);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateBRNumber = (brNo: string): boolean => {
    // Business registration number format (flexible)
    return brNo.length >= 5 && /^[A-Z0-9]+$/i.test(brNo);
  };

  const validateStep1 = () => {
    if (!formData.mobileNumber || !formData.email || !formData.permanentAddress) {
      setError('Please fill all required owner identification fields');
      return false;
    }
    
    // Validate phone number format
    if (!validatePhoneNumber(formData.mobileNumber)) {
      setError('Invalid mobile number format. Must be 10 digits starting with 0 (e.g., 0771234567)');
      return false;
    }
    
    // Validate email format
    if (!validateEmail(formData.email)) {
      setError('Invalid email address format');
      return false;
    }
    
    // Validate emergency contact if provided
    if (formData.emergencyContactNumber && !validatePhoneNumber(formData.emergencyContactNumber)) {
      setError('Invalid emergency contact number format. Must be 10 digits starting with 0');
      return false;
    }
    
    if (formData.ownerType === 'individual') {
      if (!formData.fullName) {
        setError('Full name is required for individual owners');
        return false;
      }
      // Validate NIC if provided
      if (formData.nicNumber && !validateNIC(formData.nicNumber)) {
        setError('Invalid NIC format. Must be 9 digits + V/X (old) or 12 digits (new)');
        return false;
      }
    }
    
    if (formData.ownerType === 'company') {
      if (!formData.companyName) {
        setError('Company name is required for business owners');
        return false;
      }
      // Validate BR number if provided
      if (formData.brNumber && !validateBRNumber(formData.brNumber)) {
        setError('Invalid Business Registration number format');
        return false;
      }
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.busRegistrationNumber || !formData.vehicleType || !formData.seatingCapacity) {
      setError('Please fill all required vehicle details');
      return false;
    }
    
    // Validate vehicle registration number format
    if (!validateVehicleRegistration(formData.busRegistrationNumber)) {
      setError('Invalid vehicle registration number format. Must be in format ABC-1234 or AB-1234');
      return false;
    }
    
    // Validate seating capacity
    const capacity = parseInt(formData.seatingCapacity);
    if (isNaN(capacity) || capacity < 10 || capacity > 100) {
      setError('Seating capacity must be between 10 and 100');
      return false;
    }
    
    // Validate dates if provided
    if (formData.permitExpiryDate) {
      const permitDate = new Date(formData.permitExpiryDate);
      if (permitDate < new Date()) {
        setError('Route permit expiry date cannot be in the past');
        return false;
      }
    }
    
    if (formData.insuranceExpiryDate) {
      const insuranceDate = new Date(formData.insuranceExpiryDate);
      if (insuranceDate < new Date()) {
        setError('Insurance expiry date cannot be in the past');
        return false;
      }
    }
    
    if (formData.revenueLicenseExpiry) {
      const revenueDate = new Date(formData.revenueLicenseExpiry);
      if (revenueDate < new Date()) {
        setError('Revenue license expiry date cannot be in the past');
        return false;
      }
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (!formData.lastMaintenanceDate) {
      setError('Please provide maintenance information');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
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
    if (step === 3 && !validateStep3()) return;
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep4()) return;

    try {
      setLoading(true);

      const submitData = new FormData();
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && !(value instanceof File)) {
          submitData.append(key, value.toString());
        }
      });

      // Add files
      const fileFields = [
        'vehicleBookCopy',
        'routePermitBookCopy',
        'insuranceCertificate',
        'revenueLicenseScan',
        'ownerPhoto',
        'fitnessReport',
      ];
      
      fileFields.forEach(field => {
        const file = formData[field as keyof typeof formData];
        if (file instanceof File) {
          submitData.append(field, file);
        }
      });

      // Add role
      submitData.append('role', 'owner');

      const response = await fetch('/api/auth/register/owner', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Bus owner registration successful! Please wait for admin approval.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Bus Owner Registration</h2>
          <p className="mt-2 text-gray-600">Register your bus fleet with complete documentation</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-1 items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'} font-semibold`}>
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>Owner Info</span>
            <span>Vehicle Details</span>
            <span>Safety & Docs</span>
            <span>Login</span>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Step 1: Owner Identification */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Owner Identification</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ownerType"
                        value="individual"
                        checked={formData.ownerType === 'individual'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Individual
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="ownerType"
                        value="company"
                        checked={formData.ownerType === 'company'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Company/Business
                    </label>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {formData.ownerType === 'individual' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
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
                          placeholder="123456789V"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">BR Number *</label>
                        <input
                          type="text"
                          name="brNumber"
                          value={formData.brNumber}
                          onChange={handleInputChange}
                          placeholder="Business Registration Number"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {formData.ownerType === 'individual' ? 'Permanent Address' : 'Registered Business Address'} *
                    </label>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  {formData.ownerType === 'company' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="sameAddress"
                            checked={formData.sameAddress}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600"
                          />
                          <span className="text-sm text-gray-700">Business address is same as registered address</span>
                        </label>
                      </div>

                      {!formData.sameAddress && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Current Business Address</label>
                          <textarea
                            name="businessAddress"
                            value={formData.businessAddress}
                            onChange={handleInputChange}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="+94771234567"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
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
                      placeholder="owner@example.com"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact Number</label>
                    <input
                      type="tel"
                      name="emergencyContactNumber"
                      value={formData.emergencyContactNumber}
                      onChange={handleInputChange}
                      placeholder="+94771234567"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Owner Photo / Company Logo</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={(e) => handleFileChange(e, 'ownerPhoto')}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Accepted: JPG, PNG, WebP, PDF (Max 5MB)</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Vehicle Details</h3>
                <p className="text-sm text-gray-600">Enter details for your first bus (you can add more buses later)</p>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bus Registration Number *</label>
                    <input
                      type="text"
                      name="busRegistrationNumber"
                      value={formData.busRegistrationNumber}
                      onChange={handleInputChange}
                      placeholder="ABC-1234 or AB-5678"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 uppercase focus:border-green-500 focus:outline-none"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: ABC-1234 or AB-1234</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chassis Number *</label>
                    <input
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Engine Number *</label>
                    <input
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Numbers</label>
                    <input
                      type="text"
                      name="routeNumbers"
                      value={formData.routeNumbers}
                      onChange={handleInputChange}
                      placeholder="e.g., 138, 177"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Route Permit Number *</label>
                    <input
                      type="text"
                      name="routePermitNumber"
                      value={formData.routePermitNumber}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Permit Expiry Date *</label>
                    <input
                      type="date"
                      name="permitExpiryDate"
                      value={formData.permitExpiryDate}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="ac">AC</option>
                      <option value="non-ac">Non-AC</option>
                      <option value="semi-luxury">Semi-Luxury</option>
                      <option value="normal">Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Seating Capacity *</label>
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={formData.seatingCapacity}
                      onChange={handleInputChange}
                      placeholder="e.g., 52"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Insurance Type *</label>
                    <select
                      name="insuranceType"
                      value={formData.insuranceType}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Insurance</option>
                      <option value="third-party">Third Party</option>
                      <option value="comprehensive">Comprehensive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Insurance Expiry Date *</label>
                    <input
                      type="date"
                      name="insuranceExpiryDate"
                      value={formData.insuranceExpiryDate}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emission Test Certificate #</label>
                    <input
                      type="text"
                      name="emissionTestCertificate"
                      value={formData.emissionTestCertificate}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emission Test Expiry</label>
                    <input
                      type="date"
                      name="emissionTestExpiry"
                      value={formData.emissionTestExpiry}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Revenue License Number *</label>
                    <input
                      type="text"
                      name="revenueLicenseNumber"
                      value={formData.revenueLicenseNumber}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Revenue License Expiry *</label>
                    <input
                      type="date"
                      name="revenueLicenseExpiry"
                      value={formData.revenueLicenseExpiry}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
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
                    className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Safety & Documentation */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Bus Condition & Safety Compliance</h3>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Maintenance Date *</label>
                    <input
                      type="date"
                      name="lastMaintenanceDate"
                      value={formData.lastMaintenanceDate}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Scheduled Maintenance</label>
                    <input
                      type="date"
                      name="nextMaintenanceDate"
                      value={formData.nextMaintenanceDate}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tyre Condition (Front)</label>
                    <select
                      name="tyreConditionFront"
                      value={formData.tyreConditionFront}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Select Condition</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs-replacement">Needs Replacement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tyre Condition (Rear)</label>
                    <select
                      name="tyreConditionRear"
                      value={formData.tyreConditionRear}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Select Condition</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="needs-replacement">Needs Replacement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Brake Test Report #</label>
                    <input
                      type="text"
                      name="brakeTestReport"
                      value={formData.brakeTestReport}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold text-gray-900">Safety Equipment</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="firstAidBoxAvailable"
                        checked={formData.firstAidBoxAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">First-Aid Box Available</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="fireExtinguisherAvailable"
                        checked={formData.fireExtinguisherAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">Fire Extinguisher Available</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="cctvAvailable"
                        checked={formData.cctvAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">CCTV System Installed</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="gpsTrackerAvailable"
                        checked={formData.gpsTrackerAvailable}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600"
                      />
                      <span className="text-sm text-gray-700">GPS Tracker Installed</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 font-semibold text-gray-900">Upload Documents</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Book Copy *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileChange(e, 'vehicleBookCopy')}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, PDF (Max 5MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Route Permit Book *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileChange(e, 'routePermitBookCopy')}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, PDF (Max 5MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insurance Certificate *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileChange(e, 'insuranceCertificate')}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, PDF (Max 5MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Revenue License Scan *</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileChange(e, 'revenueLicenseScan')}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, PDF (Max 5MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bus Fitness Report</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => handleFileChange(e, 'fitnessReport')}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      />
                    </div>
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
                    className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700"
                  >
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Login Credentials */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">System Access Credentials</h3>

                <div className="grid gap-6 md:grid-cols-2">

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 characters"
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-green-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="font-semibold text-green-900">Registration Review Process</h4>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>✓ Your registration will be reviewed by the admin team</li>
                    <li>✓ All submitted documents will be verified</li>
                    <li>✓ Vehicle compliance will be checked</li>
                    <li>✓ You will receive email notification once approved</li>
                  </ul>
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
          <Link href="/login" className="font-semibold text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
