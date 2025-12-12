import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { hashPassword } from '@/lib/auth/password';
import User from '@/lib/models/User';
import Driver from '@/lib/models/Driver';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    
    // Extract all fields from FormData
    const userData = {
      // Personal Information
      fullName: formData.get('fullName') as string,
      nicNumber: formData.get('nicNumber') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      gender: formData.get('gender') as string,
      
      // Address
      permanentAddress: formData.get('permanentAddress') as string,
      currentAddress: formData.get('sameAddress') === 'true' 
        ? formData.get('permanentAddress') as string 
        : (formData.get('currentAddress') as string || formData.get('permanentAddress') as string),
      
      // Contact
      mobileNumber: formData.get('mobileNumber') as string,
      email: formData.get('email') as string,
      emergencyContactName: formData.get('emergencyContactName') as string || '',
      emergencyContactRelation: formData.get('emergencyContactRelation') as string || '',
      emergencyContactNumber: formData.get('emergencyContactNumber') as string || '',
      
      // License
      licenseNumber: formData.get('licenseNumber') as string,
      licenseExpiry: formData.get('licenseExpiry') as string,
      licenseType: formData.get('licenseType') as string,
      licenseIssuedDistrict: formData.get('licenseIssuedDistrict') as string || '',
      
      // Login credentials
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: 'driver'
    };

    // Validate required fields
    if (!userData.fullName || !userData.nicNumber || !userData.email || !userData.mobileNumber || !userData.password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { 'profile.phone': userData.mobileNumber }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or phone number already exists' },
        { status: 400 }
      );
    }

    // Check if driver with NIC or license already exists
    const existingDriver = await Driver.findOne({
      $or: [
        { nicNumber: userData.nicNumber },
        { licenseNumber: userData.licenseNumber }
      ]
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: 'Driver with this NIC or license number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Split full name into first and last name
    const nameParts = userData.fullName.trim().split(' ');
    const firstName = nameParts[0] || 'Driver';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';

    // Create user account
    const user = await User.create({
      email: userData.email,
      passwordHash,
      role: 'driver',
      profile: {
        firstName,
        lastName,
        phone: userData.mobileNumber,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
        address: userData.permanentAddress,
        emergencyContact: userData.emergencyContactNumber,
      },
      isVerified: false,
      refreshTokens: []
    });

    // Handle file uploads
    // TODO: In production, implement actual file upload to Cloudinary or AWS S3:
    // const licenseFrontImage = formData.get('licenseFrontImage') as File;
    // const licenseBackImage = formData.get('licenseBackImage') as File;
    // const profilePhoto = formData.get('profilePhoto') as File;
    // const licenseFrontImageUrl = await uploadToCloudinary(licenseFrontImage);
    // const licenseBackImageUrl = await uploadToCloudinary(licenseBackImage);
    // const profilePhotoUrl = await uploadToCloudinary(profilePhoto);
    
    // For now, files are received but not stored (leave URLs empty)
    const licenseFrontImageUrl = '';
    const licenseBackImageUrl = '';
    const profilePhotoUrl = '';

    // Create driver profile
    const driver = await Driver.create({
      userId: user._id,
      fullName: userData.fullName,
      nicNumber: userData.nicNumber,
      dateOfBirth: new Date(userData.dateOfBirth),
      gender: userData.gender,
      permanentAddress: userData.permanentAddress,
      currentAddress: userData.currentAddress,
      mobileNumber: userData.mobileNumber,
      email: userData.email,
      emergencyContactName: userData.emergencyContactName,
      emergencyContactRelation: userData.emergencyContactRelation,
      emergencyContactNumber: userData.emergencyContactNumber,
      licenseNumber: userData.licenseNumber,
      licenseExpiry: new Date(userData.licenseExpiry),
      licenseType: userData.licenseType,
      licenseIssuedDistrict: userData.licenseIssuedDistrict,
      licenseFrontImageUrl,
      licenseBackImageUrl,
      profilePhotoUrl,
      status: 'pending',
      experienceYears: 0,
      rating: 0,
      totalTrips: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Driver registration successful. Your application is pending admin approval.',
      data: {
        userId: user._id,
        driverId: driver._id,
        email: user.email,
        fullName: userData.fullName,
        status: driver.status
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Driver registration error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate entry. User, NIC, or license number already exists.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Registration failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
