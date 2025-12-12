import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth/password';
import User from '@/lib/models/User';
import Owner from '@/lib/models/Owner';
import Bus from '@/lib/models/Bus';

export async function POST(request: NextRequest) {
  console.log('=== Owner Registration Started ===');
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected');

    console.log('Parsing form data...');
    const formData = await request.formData();
    
    console.log('=== Owner Registration Request ===');
    console.log('Form fields:', Array.from(formData.keys()));
    
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
      capacity: formData.get('seatingCapacity') ? parseInt(formData.get('seatingCapacity') as string) : 0,
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

    console.log('Owner data:', { ...ownerData, password: '[REDACTED]' });
    console.log('Bus data:', busData);

    // Validate required fields
    if (!ownerData.email || !ownerData.password || !ownerData.permanentAddress || !ownerData.mobileNumber) {
      console.log('Missing required owner fields:', {
        email: !!ownerData.email,
        password: !!ownerData.password,
        permanentAddress: !!ownerData.permanentAddress,
        mobileNumber: !!ownerData.mobileNumber
      });
      return NextResponse.json(
        { error: 'Missing required owner fields' },
        { status: 400 }
      );
    }
    
    if (ownerData.ownerType === 'individual' && !ownerData.fullName) {
      console.log('Missing fullName for individual owner');
      return NextResponse.json(
        { error: 'Full name is required for individual owners' },
        { status: 400 }
      );
    }
    
    if (ownerData.ownerType === 'company' && !ownerData.companyName) {
      console.log('Missing companyName for company owner');
      return NextResponse.json(
        { error: 'Company name is required for business owners' },
        { status: 400 }
      );
    }

    if (!busData.registrationNumber || !busData.vehicleType || !busData.capacity || isNaN(busData.capacity)) {
      console.log('Missing required vehicle fields:', {
        registrationNumber: !!busData.registrationNumber,
        vehicleType: !!busData.vehicleType,
        capacity: busData.capacity,
        isValidCapacity: !isNaN(busData.capacity) && busData.capacity > 0
      });
      return NextResponse.json(
        { error: 'Missing required vehicle fields (registration number, vehicle type, or seating capacity)' },
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
    console.log('Hashing password...');
    const passwordHash = await hashPassword(ownerData.password);
    console.log('Password hashed');

    // Get name parts for User profile
    const displayName = ownerData.ownerType === 'individual' ? ownerData.fullName : ownerData.companyName;
    const nameParts = displayName?.trim().split(' ') || ['Owner'];
    const firstName = nameParts[0] || 'Owner';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';

    // Create user account
    console.log('Creating user account...');
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
    console.log('User created:', user._id);

    // Handle file uploads (placeholder for now)
    console.log('Processing file uploads...');
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
    console.log('Creating owner profile...');
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
    console.log('Owner created:', owner._id);

    // Create bus record
    console.log('Creating bus record...');
    console.log('Bus data:', busData);
    const bus = await Bus.create({
      registrationNumber: busData.registrationNumber,
      chassisNumber: busData.chassisNumber,
      engineNumber: busData.engineNumber,
      ownerId: user._id, // Use User ID, not Owner ID
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
    console.log('Bus created:', bus._id);
    console.log('=== Registration Successful ===');

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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate entry. User, email, or bus registration already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
      { status: 500 }
    );
  }
}
