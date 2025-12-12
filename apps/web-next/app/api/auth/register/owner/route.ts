import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth/password';
import User from '@/lib/models/User';
import Owner from '@/lib/models/Owner';
import Bus from '@/lib/models/Bus';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    
    // Extract all fields from FormData
    const ownerData = {
      // Owner Identification
      ownerType: formData.get('ownerType') as string,
      fullName: formData.get('fullName') as string,
      companyName: formData.get('companyName') as string,
      nicNumber: formData.get('nicNumber') as string,
      brNumber: formData.get('brNumber') as string,
      
      // Address
      permanentAddress: formData.get('permanentAddress') as string,
      businessAddress: formData.get('sameAddress') === 'true' 
        ? formData.get('permanentAddress') as string 
        : formData.get('businessAddress') as string,
      
      // Contact
      mobileNumber: formData.get('mobileNumber') as string,
      email: formData.get('email') as string,
      emergencyContactName: formData.get('emergencyContactName') as string,
      emergencyContactNumber: formData.get('emergencyContactNumber') as string,
      
      // Login credentials
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: 'owner'
    };

    const busData = {
      registrationNumber: formData.get('busRegistrationNumber') as string,
      chassisNumber: formData.get('chassisNumber') as string,
      engineNumber: formData.get('engineNumber') as string,
      routeNumbers: formData.get('routeNumbers') as string,
      routePermitNumber: formData.get('routePermitNumber') as string,
      permitExpiryDate: formData.get('permitExpiryDate') as string,
      vehicleType: formData.get('vehicleType') as string,
      capacity: parseInt(formData.get('seatingCapacity') as string),
      insuranceType: formData.get('insuranceType') as string,
      insuranceExpiryDate: formData.get('insuranceExpiryDate') as string,
      emissionTestCertificate: formData.get('emissionTestCertificate') as string,
      emissionTestExpiry: formData.get('emissionTestExpiry') as string,
      revenueLicenseNumber: formData.get('revenueLicenseNumber') as string,
      revenueLicenseExpiry: formData.get('revenueLicenseExpiry') as string,
      lastMaintenanceDate: formData.get('lastMaintenanceDate') as string,
      nextMaintenanceDate: formData.get('nextMaintenanceDate') as string,
      tyreConditionFront: formData.get('tyreConditionFront') as string,
      tyreConditionRear: formData.get('tyreConditionRear') as string,
      brakeTestReport: formData.get('brakeTestReport') as string,
      firstAidBoxAvailable: formData.get('firstAidBoxAvailable') === 'true',
      fireExtinguisherAvailable: formData.get('fireExtinguisherAvailable') === 'true',
      cctvAvailable: formData.get('cctvAvailable') === 'true',
      gpsTrackerAvailable: formData.get('gpsTrackerAvailable') === 'true',
    };

    // Validate required fields
    if (!ownerData.email || !ownerData.password || !ownerData.permanentAddress || !ownerData.mobileNumber) {
      return NextResponse.json(
        { error: 'Missing required owner fields' },
        { status: 400 }
      );
    }
    
    if (ownerData.ownerType === 'individual' && !ownerData.fullName) {
      return NextResponse.json(
        { error: 'Full name is required for individual owners' },
        { status: 400 }
      );
    }
    
    if (ownerData.ownerType === 'company' && !ownerData.companyName) {
      return NextResponse.json(
        { error: 'Company name is required for business owners' },
        { status: 400 }
      );
    }

    if (!busData.registrationNumber || !busData.vehicleType || !busData.capacity) {
      return NextResponse.json(
        { error: 'Missing required vehicle fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: ownerData.email },
        { 'profile.phone': ownerData.mobileNumber }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone number already exists' },
        { status: 400 }
      );
    }

    // Check if bus already registered
    const existingBus = await Bus.findOne({
      registrationNumber: busData.registrationNumber
    });

    if (existingBus) {
      return NextResponse.json(
        { error: 'Bus with this registration number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(ownerData.password);

    // Get name parts for User profile
    const displayName = ownerData.ownerType === 'individual' ? ownerData.fullName : ownerData.companyName;
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || 'Owner';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';

    // Create user account
    const user = await User.create({
      email: ownerData.email,
      passwordHash,
      role: 'owner',
      profile: {
        firstName,
        lastName,
        phone: ownerData.mobileNumber,
        address: ownerData.permanentAddress,
        emergencyContact: ownerData.emergencyContactNumber,
      },
      isVerified: false,
      refreshTokens: []
    });

    // Handle file uploads (placeholder for now)
    const ownerPhoto = formData.get('ownerPhoto') as File;
    const vehicleBookCopy = formData.get('vehicleBookCopy') as File;
    const routePermitBookCopy = formData.get('routePermitBookCopy') as File;
    const insuranceCertificate = formData.get('insuranceCertificate') as File;
    const revenueLicenseScan = formData.get('revenueLicenseScan') as File;
    const fitnessReport = formData.get('fitnessReport') as File;

    // Placeholder URLs (in production, upload to cloud storage)
    const ownerPhotoUrl = ownerPhoto ? `/uploads/owners/${user._id}/photo.jpg` : '';
    const vehicleBookUrl = vehicleBookCopy ? `/uploads/buses/${busData.registrationNumber}/vehicle-book.pdf` : '';
    const routePermitBookUrl = routePermitBookCopy ? `/uploads/buses/${busData.registrationNumber}/permit.pdf` : '';
    const insuranceCertificateUrl = insuranceCertificate ? `/uploads/buses/${busData.registrationNumber}/insurance.pdf` : '';
    const revenueLicenseScanUrl = revenueLicenseScan ? `/uploads/buses/${busData.registrationNumber}/revenue.pdf` : '';
    const fitnessReportUrl = fitnessReport ? `/uploads/buses/${busData.registrationNumber}/fitness.pdf` : '';

    // Create owner profile
    const owner = await Owner.create({
      userId: user._id,
      ownerType: ownerData.ownerType,
      fullName: ownerData.fullName,
      companyName: ownerData.companyName,
      nicNumber: ownerData.nicNumber,
      brNumber: ownerData.brNumber,
      permanentAddress: ownerData.permanentAddress,
      businessAddress: ownerData.businessAddress,
      mobileNumber: ownerData.mobileNumber,
      email: ownerData.email,
      emergencyContactName: ownerData.emergencyContactName,
      emergencyContactNumber: ownerData.emergencyContactNumber,
      ownerPhotoUrl,
      status: 'pending',
      totalBuses: 1
    });

    // Create bus record
    const bus = await Bus.create({
      registrationNumber: busData.registrationNumber,
      chassisNumber: busData.chassisNumber,
      engineNumber: busData.engineNumber,
      ownerId: owner._id,
      routeNumbers: busData.routeNumbers,
      routePermitNumber: busData.routePermitNumber,
      permitExpiryDate: new Date(busData.permitExpiryDate),
      vehicleType: busData.vehicleType,
      capacity: busData.capacity,
      insuranceType: busData.insuranceType,
      insuranceExpiryDate: new Date(busData.insuranceExpiryDate),
      emissionTestCertificate: busData.emissionTestCertificate,
      emissionTestExpiry: busData.emissionTestExpiry ? new Date(busData.emissionTestExpiry) : undefined,
      revenueLicenseNumber: busData.revenueLicenseNumber,
      revenueLicenseExpiry: new Date(busData.revenueLicenseExpiry),
      lastMaintenanceDate: new Date(busData.lastMaintenanceDate),
      nextMaintenanceDate: busData.nextMaintenanceDate ? new Date(busData.nextMaintenanceDate) : undefined,
      tyreConditionFront: busData.tyreConditionFront,
      tyreConditionRear: busData.tyreConditionRear,
      brakeTestReport: busData.brakeTestReport,
      firstAidBoxAvailable: busData.firstAidBoxAvailable,
      fireExtinguisherAvailable: busData.fireExtinguisherAvailable,
      cctvAvailable: busData.cctvAvailable,
      gpsTrackerAvailable: busData.gpsTrackerAvailable,
      vehicleBookUrl,
      routePermitBookUrl,
      insuranceCertificateUrl,
      revenueLicenseScanUrl,
      fitnessReportUrl,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      message: 'Bus owner registration successful. Your application is pending admin approval.',
      data: {
        userId: user._id,
        ownerId: owner._id,
        busId: bus._id,
        email: user.email,
        name: displayName,
        registrationNumber: bus.registrationNumber,
        status: owner.status
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Owner registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate entry. User, email, or bus registration already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
